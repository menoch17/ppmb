import { cache } from "react";
import { createClient, type Client } from "@libsql/client";

import { FORUMS_PER_PAGE, POSTS_PER_PAGE } from "@/lib/format";
import type { Channel, Post, SearchResult, Thread } from "@/lib/types";

let client: Client | null = null;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("Missing TURSO_DATABASE_URL environment variable.");
    }

    client = createClient({ url, authToken });
  }

  return client;
}

function rows<T>(result: { rows: Record<string, unknown>[] }): T[] {
  return result.rows as T[];
}

export const getAllChannels = cache(async () => {
  const db = getClient();
  const result = await db.execute(
    "SELECT * FROM channels ORDER BY parentid ASC, displayorder ASC, nodeid ASC"
  );
  return rows<Channel>(result);
});

export const getRootChannels = cache(async () => {
  const channels = await getAllChannels();
  return channels.filter((channel) => channel.parentid < 0);
});

export const getChannel = cache(async (channelId: number) => {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM channels WHERE nodeid = ? LIMIT 1",
    args: [channelId]
  });
  return (rows<Channel>(result)[0] ?? null) as Channel | null;
});

export const getChildChannels = cache(async (parentId: number) => {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM channels WHERE parentid = ? ORDER BY displayorder ASC, nodeid ASC",
    args: [parentId]
  });
  return rows<Channel>(result);
});

export async function getThreadsByChannel(channelId: number, page: number) {
  const offset = (page - 1) * FORUMS_PER_PAGE;
  const db = getClient();

  const [dataResult, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM threads WHERE channel_id = ?
            ORDER BY sticky DESC, lastcontent DESC NULLS LAST, nodeid DESC
            LIMIT ? OFFSET ?`,
      args: [channelId, FORUMS_PER_PAGE, offset]
    }),
    db.execute({
      sql: "SELECT COUNT(*) as count FROM threads WHERE channel_id = ?",
      args: [channelId]
    })
  ]);

  return {
    threads: rows<Thread>(dataResult),
    totalCount: Number(countResult.rows[0].count ?? 0)
  };
}

export const getThread = cache(async (threadId: number) => {
  const db = getClient();
  const result = await db.execute({
    sql: "SELECT * FROM threads WHERE nodeid = ? LIMIT 1",
    args: [threadId]
  });
  return (rows<Thread>(result)[0] ?? null) as Thread | null;
});

export async function getPostsByThread(threadId: number, page: number) {
  const offset = (page - 1) * POSTS_PER_PAGE;
  const db = getClient();

  const [dataResult, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM posts WHERE thread_id = ?
            ORDER BY publishdate ASC NULLS FIRST, nodeid ASC
            LIMIT ? OFFSET ?`,
      args: [threadId, POSTS_PER_PAGE, offset]
    }),
    db.execute({
      sql: "SELECT COUNT(*) as count FROM posts WHERE thread_id = ?",
      args: [threadId]
    })
  ]);

  return {
    posts: rows<Post>(dataResult),
    totalCount: Number(countResult.rows[0].count ?? 0)
  };
}

export async function searchThreads(query: string, page: number) {
  const normalized = query.trim();

  if (!normalized) {
    return { results: [] as SearchResult[], totalCount: 0 };
  }

  const offset = (page - 1) * FORUMS_PER_PAGE;
  const pattern = `%${normalized}%`;
  // Wrap in quotes so FTS5 treats it as a phrase, escaping any internal quotes
  const ftsQuery = `"${normalized.replace(/"/g, '""')}"`;
  const db = getClient();

  const [dataResult, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT DISTINCT t.nodeid, t.channel_id, t.title, t.authorname, t.publishdate, t.lastcontent, c.title as channel_title
            FROM threads t
            LEFT JOIN channels c ON c.nodeid = t.channel_id
            WHERE t.title LIKE ? OR t.authorname LIKE ?
              OR t.nodeid IN (
                SELECT p.thread_id FROM posts p
                JOIN posts_fts ON posts_fts.rowid = p.nodeid
                WHERE posts_fts MATCH ?
              )
            ORDER BY t.lastcontent DESC NULLS LAST
            LIMIT ? OFFSET ?`,
      args: [pattern, pattern, ftsQuery, FORUMS_PER_PAGE, offset]
    }),
    db.execute({
      sql: `SELECT COUNT(DISTINCT t.nodeid) as count
            FROM threads t
            WHERE t.title LIKE ? OR t.authorname LIKE ?
              OR t.nodeid IN (
                SELECT p.thread_id FROM posts p
                JOIN posts_fts ON posts_fts.rowid = p.nodeid
                WHERE posts_fts MATCH ?
              )`,
      args: [pattern, pattern, ftsQuery]
    })
  ]);

  const results: SearchResult[] = dataResult.rows.map((row) => ({
    nodeid: row.nodeid as number,
    channel_id: row.channel_id as number,
    title: row.title as string,
    authorname: row.authorname as string | null,
    publishdate: row.publishdate as number | null,
    lastcontent: row.lastcontent as number | null,
    channel_title: (row.channel_title as string | null) ?? "Unknown forum"
  }));

  return {
    results,
    totalCount: Number(countResult.rows[0].count ?? 0)
  };
}
