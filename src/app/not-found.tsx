import { ArchiveShell } from "@/components/archive-shell";

export default function NotFound() {
  return (
    <ArchiveShell title="Page not found" subtitle="That forum or thread does not exist in the archive.">
      <section className="panel">
        <div className="emptyState">Try going back home, browsing the forum list, or searching for the thread title instead.</div>
      </section>
    </ArchiveShell>
  );
}
