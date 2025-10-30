// BookFinder.jsx
// React single-file app (default export) for the assignment.
// Purpose: Search books using Open Library Search API and show results (covers, authors, year).
// Features:
// - Search by title
// - Pagination (next/prev)
// - View details for a book
// - Save favorites (localStorage)
// - Error handling and responsive layout
// How to use this file:
// - In a Vite React project (or CodeSandbox React), replace App.jsx with this file and render <BookFinder /> as default.

import React, { useEffect, useState } from "react";

export default function BookFinder() {
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState("title"); // 'title' or 'author'
  const [sortBy, setSortBy] = useState("relevance"); // 'relevance' | 'year-asc' | 'year-desc'
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bf_favorites") || "[]");
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bf_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    // when query or searchField changes, reset page
    setPage(1);
  }, [query, searchField]);

  // Helper to compute cover URL
  function coverUrl(doc) {
    if (doc.cover_i)
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    if (doc.isbn && doc.isbn.length)
      return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
    return null;
  }

  function uniqueKeyForDoc(doc) {
    return (
      doc.key ||
      doc.cover_edition_key ||
      `${doc.title}-${(doc.author_name || ["?"])[0]}`
    );
  }

  function toggleFavorite(doc) {
    const key = uniqueKeyForDoc(doc);
    const exists = favorites.find((f) => f.key === key);
    if (exists) {
      setFavorites(favorites.filter((f) => f.key !== key));
    } else {
      const toSave = {
        key,
        title: doc.title,
        author_name: doc.author_name,
        year: doc.first_publish_year,
        cover_i: doc.cover_i,
      };
      setFavorites([toSave, ...favorites]);
    }
  }

  function isFavorite(doc) {
    const key = uniqueKeyForDoc(doc);
    return favorites.some((f) => f.key === key);
  }

  function sortResults(docs, mode = sortBy) {
    if (!docs || docs.length === 0) return docs;
    if (mode === "relevance") return docs; // API returned relevance order
    const copy = [...docs];
    // use numeric year; missing years treated as Infinity (for asc) or -Infinity (for desc)
    copy.sort((a, b) => {
      const ay =
        typeof a.first_publish_year === "number" ? a.first_publish_year : null;
      const by =
        typeof b.first_publish_year === "number" ? b.first_publish_year : null;
      const aVal =
        ay === null ? (mode === "year-asc" ? Infinity : -Infinity) : ay;
      const bVal =
        by === null ? (mode === "year-asc" ? Infinity : -Infinity) : by;
      if (mode === "year-asc") return aVal - bVal;
      return bVal - aVal;
    });
    return copy;
  }

  async function searchBooks(q, p = 1) {
    if (!q) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      // Build URL based on chosen search field
      const base = "https://openlibrary.org/search.json";
      const params = new URLSearchParams();
      // Code: Support searching by title OR author
      if (searchField === "title") params.set("title", q);
      else if (searchField === "author") params.set("author", q);
      // page param
      params.set("page", String(p));
      const url = `${base}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setNumFound(data.numFound || 0);
      let docs = data.docs || [];
      docs = sortResults(docs, sortBy); // apply current sorting
      setResults(docs);
    } catch (err) {
      setError(err.message || "Unknown error");
      setResults([]);
      setNumFound(0);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    searchBooks(query.trim(), 1);
    setPage(1);
  }

  function gotoPage(newPage) {
    if (newPage < 1) return;
    setPage(newPage);
    searchBooks(query, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // When user changes sort, re-sort current results in-place
  function handleSortChange(e) {
    const newSort = e.target.value;
    setSortBy(newSort);
    const sorted = sortResults(results, newSort);
    setResults(sorted);
  }

  // Small inline styles (kept inside to be a single file) - feel free to replace with CSS/Tailwind
  return (
    <div className="bf-root">
      <style>{`
        .bf-root{font-family:Inter, system-ui, Arial;max-width:1100px;margin:20px auto;padding:16px}
        .bf-header{display:flex;flex-direction:column;gap:6px}
        .bf-title{font-size:22px;font-weight:700;display:flex;gap:12px;align-items:center}
        .bf-form{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center}
        .bf-input{flex:1;min-width:220px;padding:10px;border-radius:8px;border:1px solid #ccc}
        .bf-btn{padding:10px 14px;border-radius:8px;border:0;background:#2563eb;color:white;cursor:pointer}
        .bf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:18px}
        .bf-card{border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:white;display:flex;flex-direction:column;gap:8px}
        .bf-cover{height:260px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-radius:6px;overflow:hidden}
        .bf-cover img{max-width:100%;max-height:100%}
        .bf-meta{font-size:14px;color:#111}
        .bf-small{font-size:12px;color:#6b7280}
        .bf-controls{display:flex;justify-content:space-between;align-items:center;margin-top:12px}
        .bf-pagination{display:flex;gap:8px;align-items:center}
        .bf-fav{background:#f3f4f6;border-radius:6px;padding:6px 8px;border:1px solid #e5e7eb;cursor:pointer}
        .bf-selected{margin-top:18px;padding:12px;border-radius:10px;background:#fff;border:1px solid #e6eefc}
        @media (max-width:640px){ .bf-cover{height:180px} .bf-controls{flex-direction:column;align-items:flex-start;gap:8px} }
        .controls-row{display:flex;gap:8px;align-items:center}
        .select{padding:8px;border-radius:8px;border:1px solid #ccc;background:white}
      `}</style>

      <div className="bf-header">
        <div className="bf-title">📚 BookFinder — Search Open Library</div>
        <div className="bf-small">
          Search by Title or Author. Sort results by publish year.
        </div>
      </div>

      <form className="bf-form" onSubmit={handleSubmit}>
        <input
          className="bf-input"
          placeholder={
            searchField === "title"
              ? "Search books by title (e.g., 'Pride and Prejudice')"
              : "Search books by author (e.g., 'Tolkien')"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="controls-row">
          <select
            className="select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            title="Search field"
          >
            <option value="title">Search by Title</option>
            <option value="author">Search by Author</option>
          </select>

          <select className="select" value={sortBy} onChange={handleSortChange}>
            <option value="relevance">Sort: Relevance (default)</option>
            <option value="year-desc">Sort: Year (newest first)</option>
            <option value="year-asc">Sort: Year (oldest first)</option>
          </select>

          <button type="submit" className="bf-btn">
            Search
          </button>
        </div>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="bf-fav"
          onClick={() => {
            setSelected({ type: "favorites" });
          }}
        >
          ⭐ Favorites ({favorites.length})
        </button>
        <button
          className="bf-fav"
          onClick={() => {
            setSelected(null);
          }}
        >
          🔎 Search Results
        </button>
      </div>

      {loading && <div style={{ marginTop: 18 }}>Loading…</div>}
      {error && (
        <div style={{ marginTop: 18, color: "#b91c1c" }}>Error: {error}</div>
      )}

      {!loading && selected && selected.type === "favorites" && (
        <div className="bf-selected">
          <h3>⭐ Your Favorites</h3>
          {favorites.length === 0 ? (
            <div className="bf-small">
              No favorites yet — add some from search results.
            </div>
          ) : (
            <div className="bf-grid">
              {favorites.map((f) => (
                <div className="bf-card" key={f.key}>
                  <div className="bf-cover">
                    {f.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${f.cover_i}-M.jpg`}
                        alt={f.title}
                      />
                    ) : (
                      <div className="bf-small">No cover</div>
                    )}
                  </div>
                  <div>
                    <div className="bf-meta">{f.title}</div>
                    <div className="bf-small">
                      {(f.author_name || []).join(", ")}
                    </div>
                    <div className="bf-small">{f.year || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && (!selected || selected.type !== "favorites") && (
        <>
          {results.length === 0 && numFound === 0 && (
            <div style={{ marginTop: 18 }} className="bf-small">
              No results yet — try searching for a title or author above.
            </div>
          )}

          {results.length > 0 && (
            <>
              <div style={{ marginTop: 12 }} className="bf-controls">
                <div className="bf-small">
                  Showing page {page} — {numFound} results found
                </div>
                <div className="bf-pagination">
                  <button className="bf-fav" onClick={() => gotoPage(page - 1)}>
                    Prev
                  </button>
                  <button className="bf-fav" onClick={() => gotoPage(page + 1)}>
                    Next
                  </button>
                </div>
              </div>

              <div className="bf-grid">
                {results.map((doc) => (
                  <div className="bf-card" key={uniqueKeyForDoc(doc)}>
                    <div
                      className="bf-cover"
                      onClick={() => setSelected({ type: "doc", doc })}
                    >
                      {coverUrl(doc) ? (
                        <img
                          src={coverUrl(doc)}
                          alt={`Cover of ${doc.title}`}
                        />
                      ) : (
                        <div className="bf-small">No cover</div>
                      )}
                    </div>

                    <div>
                      <div className="bf-meta">{doc.title}</div>
                      <div className="bf-small">
                        {(doc.author_name || []).join(", ")}
                      </div>
                      <div className="bf-small">
                        First published: {doc.first_publish_year || "—"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                      }}
                    >
                      <button
                        className="bf-fav"
                        onClick={() => toggleFavorite(doc)}
                      >
                        {isFavorite(doc) ? "Remove" : "Favorite"}
                      </button>
                      <button
                        className="bf-fav"
                        onClick={() => setSelected({ type: "doc", doc })}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selected && selected.type === "doc" && (
            <div className="bf-selected">
              <h3>{selected.doc.title}</h3>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ width: 180 }}>
                  {coverUrl(selected.doc) ? (
                    <img
                      src={coverUrl(selected.doc)}
                      alt="cover"
                      style={{ width: "100%", borderRadius: 8 }}
                    />
                  ) : (
                    <div className="bf-cover" style={{ height: 180 }}>
                      No cover
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="bf-meta">
                    Author(s): {(selected.doc.author_name || []).join(", ")}
                  </div>
                  <div className="bf-small">
                    Publication year: {selected.doc.first_publish_year || "—"}
                  </div>
                  <div className="bf-small">
                    Publisher:{" "}
                    {(selected.doc.publisher || []).slice(0, 3).join(", ") ||
                      "—"}
                  </div>
                  <div style={{ marginTop: 8 }} className="bf-small">
                    Subjects:{" "}
                    {(selected.doc.subject || []).slice(0, 8).join(", ")}
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      className="bf-btn"
                      onClick={() => toggleFavorite(selected.doc)}
                    >
                      {isFavorite(selected.doc)
                        ? "Remove Favorite"
                        : "Add to Favorites"}
                    </button>
                    <button
                      className="bf-fav"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <footer style={{ marginTop: 22, color: "#6b7280", fontSize: 13 }}>
        Data from Open Library. Built for assignment — lightweight and
        responsive.
      </footer>
    </div>
  );
}
