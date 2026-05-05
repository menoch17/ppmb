import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveShell } from "@/components/archive-shell";
import { Pagination } from "@/components/pagination";
import { getAllChannels, getChannel, getChildChannels, getThreadsByChannel } from "@/lib/archive";
import { buildChannelTrail, excerpt, FORUMS_PER_PAGE, formatTimestamp, parsePage, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type ForumPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ForumPage({ params, searchParams }: ForumPageProps) {
  const [{ id }, resolvedSearch] = await Promise.all([params, searchParams]);
  const channelId = Number.parseInt(id, 10);
  const page = parsePage(resolvedSearch.page);

  if (!Number.isFinite(channelId)) {
    notFound();
  }

  const [channel, allChannels, childChannels, threadData] = await Promise.all([
    getChannel(channelId),
    getAllChannels(),
    getChildChannels(channelId),
    getThreadsByChannel(channelId, page)
  ]);

  if (!channel) {
    notFound();
  }

  const crumbs = buildChannelTrail(channel.nodeid, allChannels).map((item) => ({
    href: item.nodeid === channel.nodeid ? undefined : `/forum/${item.nodeid}`,
    label: item.title
  }));

  return (
    <ArchiveShell
      title={channel.title}
      subtitle={channel.description || "Archived threads from the original board backup."}
      crumbs={crumbs}
    >
      {childChannels.length > 0 ? (
        <section className="panel">
          <h2 className="sectionTitle">Subforums</h2>
          <div className="forumGrid">
            {childChannels.map((child) => (
              <Link className="forumCard" href={`/forum/${child.nodeid}`} key={child.nodeid}>
                <div className="forumLabel">Forum</div>
                <h3>{child.title}</h3>
                <p>{child.description || "Browse this archived section."}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="sectionTitle">Threads</h2>
        <p className="sectionCopy">
          {pluralize(threadData.totalCount, "thread")} in this forum. Showing the most recently active first.
        </p>
        {threadData.threads.length > 0 ? (
          <div className="threadList">
            {threadData.threads.map((thread) => (
              <article className="threadRow" key={thread.nodeid}>
                <h3 className="threadTitle">
                  <Link href={`/thread/${thread.nodeid}`}>{thread.title}</Link>
                </h3>
                <div className="threadMeta">
                  Started by {thread.authorname || "Unknown author"} on {formatTimestamp(thread.publishdate)}. Last reply{" "}
                  {formatTimestamp(thread.lastcontent)} by {thread.lastcontentauthor || "Unknown author"}.
                </div>
                {thread.description ? <p className="threadExcerpt">{excerpt(thread.description, 220)}</p> : null}
                <div className="badgeRow">
                  <span className="badge">{pluralize(thread.textcount || thread.totalcount || 0, "post")}</span>
                  {thread.sticky ? <span className="badge">Sticky</span> : null}
                  {!thread.open ? <span className="badge">Closed</span> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">No threads were found in this archived forum.</div>
        )}
        <Pagination basePath={`/forum/${channel.nodeid}`} currentPage={page} totalCount={threadData.totalCount} pageSize={FORUMS_PER_PAGE} />
      </section>
    </ArchiveShell>
  );
}
