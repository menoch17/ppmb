"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      className="searchForm"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
      }}
    >
      <input
        aria-label="Search archived threads"
        className="searchInput"
        placeholder="Search threads and post text"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="button" type="submit">
        Search
      </button>
    </form>
  );
}
