import * as formStyles from '../styles/formStyles';

function TagFilterBar({
  manageTagMode,
  setManageTagMode,
  tagSearch,
  setTagSearch,
  sortedTags,
  filterTagIds,
  handleTagFilter,
  startEditTag,
  deleteTag,
  statusFilter,
  setStatusFilter,
  statusCounts
}) {
  return (
    <>
      <div className="relative">
        <div className="absolute left-full top-5 flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setManageTagMode(false)} disabled={!manageTagMode}
            className={`rounded-r-lg px-2 py-1.5 text-sm shadow-md transition
              ${!manageTagMode
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Filter Tags
          </button>
          <button
            type="button"
            onClick={() => setManageTagMode(true)} disabled={manageTagMode}
            className={`rounded-r-lg px-2 py-1.5 text-sm shadow-md transition
              ${manageTagMode
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Manage Tags
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 border-t-4 border-blue-500 flex flex-wrap items-center">
        <label htmlFor="tag" className={formStyles.labelFormStyle}>
          {manageTagMode ? 'Manage Tags' : 'Filter Tags'}
        </label>
        <input
          type="text"
          id="tag"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value.toLowerCase())}
          placeholder="Search task based on tag"
          className={formStyles.inputFormStyle}
        />
        <div className="flex flex-wrap w-full gap-2 mt-3 max-h-28 overflow-y-auto">
          {sortedTags.filter(t => t.name.includes(tagSearch)).map((tag) => (
            <span key={tag.id} className={`flex items-center gap-1 px-2.5 py-1 border rounded-full text-sm cursor-pointer
              ${filterTagIds.includes(tag.id)
                ? 'bg-sky-600 border-sky-600 hover:bg-sky-800 text-white'
                : 'bg-sky-50 border-gray-300 hover:bg-sky-300 text-sky-700'
            }`}
              onClick={() => handleTagFilter(tag.id)}
            >
              #{tag.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); startEditTag(tag); }}
                className={`cursor-pointer transition-all duration-150
                  ${manageTagMode ? 'opacity-100 max-w-5' : 'opacity-0 max-w-0 pointer-events-none'
                }`}
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }}
                className={`text-red-600 cursor-pointer transition-all duration-150
                  ${manageTagMode ? 'opacity-100 max-w-5' : 'opacity-0 max-w-0 pointer-events-none'
                }`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-4 -mt-4">
        {['all', 'ongoing', 'overdue', 'completed'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-sm capitalize cursor-pointer
              ${statusFilter === status ? 'bg-blue-700 hover:bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-300'}`}
          >
            {status} ({statusCounts?.[status] ?? 0})
          </button>
        ))}
      </div>
    </>
  );
}

export default TagFilterBar;