import Link from "next/link";
import type { ReactNode } from "react";

import { SearchForm } from "@/components/search-form";

type Crumb = {
  href?: string;
  label: string;
};

type ArchiveShellProps = {
  title: string;
  subtitle: string;
  crumbs?: Crumb[];
  children: ReactNode;
};

export function ArchiveShell({ title, subtitle, crumbs = [], children }: ArchiveShellProps) {
  return (
    <>
      <header className="masthead">
        <div className="wrap hero">
          <p className="eyebrow">Read-only archive</p>
          <div className="heroRow">
            <div>
              <Link className="brand" href="/">
                PPMB Archive
              </Link>
              <h1>{title}</h1>
              <p className="subhead">{subtitle}</p>
            </div>
            <div className="heroMeta">
              <p>Old threads, preserved for browsing.</p>
              <p>No posting, editing, or accounts.</p>
            </div>
          </div>
        </div>
      </header>
      <main className="wrap pageBody">
        <div className="toolbar">
          <nav className="crumbs">
            <Link href="/">Home</Link>
            {crumbs.map((crumb) => (
              <span key={`${crumb.href ?? "current"}-${crumb.label}`}>
                <span className="crumbDivider">/</span>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
          <SearchForm />
        </div>
        {children}
      </main>
    </>
  );
}
