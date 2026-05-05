"use client";

import { ArchiveShell } from "@/components/archive-shell";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <ArchiveShell title="Archive error" subtitle="The archive page hit a loading problem.">
      <section className="panel">
        <p className="sectionCopy">{error.message}</p>
        <button className="button" onClick={() => reset()} type="button">
          Try again
        </button>
      </section>
    </ArchiveShell>
  );
}
