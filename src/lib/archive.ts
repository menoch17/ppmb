import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { FORUMS_PER_PAGE, POSTS_PER_PAGE } from "@/lib/format";
import type { Channel, Post, SearchResult, Thread } from "@/lib/types";

let client: SupabaseClient | null = null;

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return client;
}

function requireData<T>(data: T | null, error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }

  if (data === null) {
    throw new Error("Archive query returned no data.");
  }

  return data;
}

export const getAllChannels = cache(async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .order("parentid", { ascending: true })
    .order("displayorder", { ascending: true })
    .order("nodeid", { ascending: true });

  return requireData<Channel[]>(data, error);
});

export const getRootChannels = cache(async () => {
  const channels = await getAllChannels();
  return channels.filter((channel) => channel.parentid < 0);
});

export const getChannel = cache(async (channelId: number) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("channels").select("*").eq("nodeid", channelId).maybeSingle();
  return requireData<Channel | null>(data, error);
});

export const getChildChannels = cache(async (parentId: number) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("parentid", parentId)
    .order("displayorder", { ascending: true })
    .order("nodeid", { ascending: true });

  return requireData<Channel[]>(data, error);
});

export async function getThreadsByChannel(channelId: number, page: number) {
  const start = (page - 1) * FORUMS_PER_PAGE;
  const end = start + FORUMS_PER_PAGE - 1;
  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from("threads")
    .select("*", { count: "exact" })
    .eq("channel_id", channelId)
    .order("sticky", { ascending: false })
    .order("lastcontent", { ascending: false, nullsFirst: false })
    .order("nodeid", { ascending: false })
    .range(start, end);

  return {
    threads: requireData<Thread[]>(data, error),
    totalCount: count ?? 0
  };
}

export const getThread = cache(async (threadId: number) => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("threads").select("*").eq("nodeid", threadId).maybeSingle();
  return requireData<Thread | null>(data, error);
});

export async function getPostsByThread(threadId: number, page: number) {
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE - 1;
  const supabase = getSupabase();
  const { data, error, count } = await supabase
    .from("posts")
    .select("*", { count: "exact" })
    .eq("thread_id", threadId)
    .order("publishdate", { ascending: true, nullsFirst: true })
    .order("nodeid", { ascending: true })
    .range(start, end);

  return {
    posts: requireData<Post[]>(data, error),
    totalCount: count ?? 0
  };
}

export async function searchThreads(query: string, page: number) {
  const start = (page - 1) * FORUMS_PER_PAGE;
  const end = start + FORUMS_PER_PAGE - 1;
  const supabase = getSupabase();
  const normalized = query.trim();

  if (!normalized) {
    return { results: [] as SearchResult[], totalCount: 0 };
  }

  const textSearch = await supabase
    .from("thread_search")
    .select("nodeid, channel_id, title, authorname, publishdate, lastcontent, channel_title", { count: "exact" })
    .textSearch("document", normalized, {
      type: "websearch",
      config: "english"
    })
    .order("lastcontent", { ascending: false, nullsFirst: false })
    .range(start, end);

  if (!textSearch.error) {
    return {
      results: textSearch.data ?? [],
      totalCount: textSearch.count ?? 0
    };
  }

  const fallback = await supabase
    .from("threads")
    .select("nodeid, channel_id, title, authorname, publishdate, lastcontent, channel:channels(title)", { count: "exact" })
    .or(`title.ilike.%${normalized}%,authorname.ilike.%${normalized}%`)
    .order("lastcontent", { ascending: false, nullsFirst: false })
    .range(start, end);

  if (fallback.error) {
    throw new Error(fallback.error.message);
  }

  type FallbackRow = {
    nodeid: number;
    channel_id: number;
    title: string;
    authorname: string | null;
    publishdate: number | null;
    lastcontent: number | null;
    channel?: { title?: string }[] | null;
  };

  const results: SearchResult[] = ((fallback.data ?? []) as FallbackRow[]).map((row) => ({
    nodeid: row.nodeid,
    channel_id: row.channel_id,
    title: row.title,
    authorname: row.authorname,
    publishdate: row.publishdate,
    lastcontent: row.lastcontent,
    channel_title: row.channel?.[0]?.title ?? "Unknown forum"
  }));

  return {
    results,
    totalCount: fallback.count ?? 0
  };
}
