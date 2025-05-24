import React from "react";

export default function TaggingPanel({
  generateKeywords,
  loadingKeywords,
  keywordError,
  keywords,
  filterTag,
  setFilterTag,
}) {
  return (
    <div className="mt-4">
      <button
        onClick={generateKeywords}
        disabled={loadingKeywords}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
      >
        {loadingKeywords ? 'Generating...' : 'Create Keywords'}
      </button>

      {keywordError && (
        <div className="text-red-500 mt-2">Error: {keywordError}</div>
      )}

      <h2 className="text-lg font-bold mb-2">Top Keywords</h2>

      {filterTag && (
        <div className="mb-2">
          <span className="text-sm mr-2">
            Filtering by: <strong>{filterTag}</strong>
          </span>
          <button
            onClick={() => setFilterTag(null)}
            className="text-blue-600 text-sm underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {keywords.map((kw) => (
          <li
            key={kw.word}
            className="bg-gray-200 rounded px-2 py-1 text-sm cursor-pointer flex justify-between items-center hover:bg-gray-300"
            onClick={() => setFilterTag(kw.word)}
          >
            <span>{kw.word} <span className="text-gray-500">({kw.count})</span></span>
            <span
              className="ml-2 text-red-500 hover:text-red-700"
              title="Mark as stopword"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: add backend call here to store this as a stopword
                alert(`"${kw.word}" marked as stopword (not implemented)`);
              }}
            >
              ✕
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}