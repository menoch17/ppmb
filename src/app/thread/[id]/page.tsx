import { notFound } from "next/navigation";

import { ArchiveShell } from "@/components/archive-shell";
import { Pagination } from "@/components/pagination";
import { bbcodeToHtml } from "@/lib/bbcode";
import { getAllChannels, getPostsByThread, getThread } from "@/lib/archive";
import { buildChannelTrail, POSTS_PER_PAGE, formatTimestamp, parsePage, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type ThreadPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const [{ id }, resolvedSearch] = await Promise.all([params, searchParams]);
  const threadId = Number.parseInt(id, 10);
  const page = parsePage(resolvedSearch.page);

  if (!Number.isFinite(threadId)) {
    notFound();
  }

  const [thread, allChannels] = await Promise.all([getThread(threadId), getAllChannels()]);

  if (!thread) {
    notFound();
  }

  const postData = await getPostsByThread(thread.nodeid, page);
  const crumbs = buildChannelTrail(thread.channel_id, allChannels).map((item) => ({
    href: `/forum/${item.nodeid}`,
    label: item.title
  }));

  return (
    <ArchiveShell
      title={thread.title}
      subtitle={`Started by ${thread.authorname || "Unknown author"} on ${formatTimestamp(thread.publishdate)}.`}
      crumbs={[...crumbs, { label: thread.title }]}
    >
      <section className="panel">
        <h2 className="sectionTitle">Thread Overview</h2>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Posts</div>
            <div className="statValue">{(postData.totalCount || thread.textcount || thread.totalcount || 0).toLocaleString()}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Last activity</div>
            <div className="statValue">{formatTimestamp(thread.lastcontent)}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Status</div>
            <div className="statValue">{thread.open ? "Open archive" : "Closed thread"}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="sectionTitle">Posts</h2>
        <p className="sectionCopy">
          Showing {pluralize(postData.posts.length, "post")} on this page from a total of {pluralize(postData.totalCount, "post")}.
        </p>
        {postData.posts.length > 0 ? (
          <div className="posts">
            {postData.posts.map((post) => (
              <article className="postCard" key={post.nodeid}>
                <div className="postHeader">
                  <div>
                    <div className="postAuthor">{post.authorname || "Unknown author"}</div>
                    {post.title ? <div className="postMeta">{post.title}</div> : null}
                  </div>
                  <div className="postMeta">
                    <div>{formatTimestamp(post.publishdate)}</div>
                    <div>Post #{post.nodeid}</div>
                  </div>
                </div>
                <div className="postBody" dangerouslySetInnerHTML={{ __html: bbcodeToHtml(post.rawtext) }} />
              </article>
            ))}
          </div>
        ) : (
          <div className="emptyState">No posts were found for this thread.</div>
        )}
        <Pagination basePath={`/thread/${thread.nodeid}`} currentPage={page} totalCount={postData.totalCount} pageSize={POSTS_PER_PAGE} />
      </section>
    </ArchiveShell>
  );
}
