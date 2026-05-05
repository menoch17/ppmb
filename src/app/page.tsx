import Link from "next/link";

import { ArchiveShell } from "@/components/archive-shell";
import { getAllChannels, getChildChannels, getRootChannels } from "@/lib/archive";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function HomePage() {
  const [rootChannels, allChannels] = await Promise.all([getRootChannels(), getAllChannels()]);
  const sections = await Promise.all(
    rootChannels.map(async (channel) => ({
      channel,
      children: await getChildChannels(channel.nodeid)
    }))
  );

  return (
    <ArchiveShell
      title="PPMB Archive"
      subtitle="Browse the preserved board by forum, then open any thread in a clean read-only archive view."
    >
      <section className="panel">
        <h2 className="sectionTitle">Forums</h2>
        <p className="sectionCopy">The archive keeps the original message board structure, including top-level sections and nested forums.</p>
        <div className="forumGrid">
          {sections.map(({ channel, children }) => (
            <article className="forumCard" key={channel.nodeid}>
                <div className="forumLabel">Section</div>
                <h3>
                  <Link href={`/forum/${channel.nodeid}`}>{channel.title}</Link>
                </h3>
                <p>{channel.description || "Top-level board section from the original archive."}</p>
                {children.length > 0 ? (
                  <div className="badgeRow">
                    {children.slice(0, 4).map((child) => (
                      <Link className="badge" href={`/forum/${child.nodeid}`} key={child.nodeid}>
                        {child.title}
                      </Link>
                    ))}
                    {children.length > 4 ? <span className="badge">+{children.length - 4} more</span> : null}
                  </div>
                ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="sectionTitle">Everything Preserved Here</h2>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statLabel">Forums</div>
            <div className="statValue">{allChannels.length.toLocaleString()}</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Mode</div>
            <div className="statValue">Read-only</div>
          </div>
          <div className="statCard">
            <div className="statLabel">Search</div>
            <div className="statValue">Threads and posts</div>
          </div>
        </div>
      </section>
    </ArchiveShell>
  );
}
