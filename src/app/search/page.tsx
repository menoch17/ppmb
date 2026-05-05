import Link from "next/link";

import { ArchiveShell } from "@/components/archive-shell";
import { Pagination } from "@/components/pagination";
import { searchThreads } from "@/lib/archive";
import { FORUMS_PER_PAGE, formatTimestamp, parsePage, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearch = await searchParams;
  const query = (Array.isArray(resolvedSearch.q) ? resolvedSearch.q[0] : resolvedSearch.q ?? "").trim();
  const page = parsePage(resolvedSearch.page);
  const result = query ? await searchThreads(query, page) : { results: [], totalCount: 0 };

  return (
    <ArchiveShell title="Search the Archive" subtitle="Look through archived thread titles and usernames across the old board.">
      <section className="panel">
        <h2 className="sectionTitle">{query ? `Results for “${query}”` : "Start a Search"}</h2>
        <p className="sectionCopy">
          {query
            ? `${pluralize(result.totalCount, "match")} found across the archive.`
            : "Use the search box above to find old thread titles or usernames."}
        </p>
        {query ? (
          result.results.length > 0 ? (
            <div className="threadList">
              {result.results.map((thread) => (
                <article className="threadRow" key={thread.nodeid}>
                  <h3 className="threadTitle">
                    <Link href={`/thread/${thread.nodeid}`}>{thread.title}</Link>
                  </h3>
                  <div className="threadMeta">
                    In <Link href={`/forum/${thread.channel_id}`}>{thread.channel_title}</Link> by {thread.authorname || "Unknown author"}.
                  </div>
                  <div className="badgeRow">
                    <span className="badge">Started {formatTimestamp(thread.publishdate)}</span>
                    <span className="badge">Last active {formatTimestamp(thread.lastcontent)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="emptyState">No archived threads matched that search yet.</div>
          )
        ) : (
          <div className="emptyState">Try searching for a band name, a post phrase, or an old username.</div>
        )}
        {query ? (
          <Pagination basePath="/search" currentPage={page} totalCount={result.totalCount} pageSize={FORUMS_PER_PAGE} query={query} />
        ) : null}
      </section>
    </ArchiveShell>
  );
}
