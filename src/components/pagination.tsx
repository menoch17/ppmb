import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalCount: number;
  pageSize: number;
  query?: string;
};

export function Pagination({ basePath, currentPage, totalCount, pageSize, query }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const makeHref = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) {
      params.set("page", String(page));
    }
    if (query) {
      params.set("q", query);
    }

    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  return (
    <nav aria-label="Pagination" className="pager">
      {currentPage > 1 ? (
        <Link href={makeHref(currentPage - 1)}>Previous page</Link>
      ) : (
        <span className="pagerGhost">Previous page</span>
      )}
      <span className="pagerLabel">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link href={makeHref(currentPage + 1)}>Next page</Link>
      ) : (
        <span className="pagerGhost">Next page</span>
      )}
    </nav>
  );
}
