import * as formStyles from '../styles/formStyles';

function TaskForm({
  taskForm,
  setTaskForm,
  formError,
  editingId,
  onSubmit,
  sortedTags,
  tagSearch,
  setTagSearch,
  selectedTagIds,
  setSelectedTagIds,
}) {
  const handleTaskInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setTaskForm((prev) => {
      if (type === 'checkbox' && Array.isArray(prev[name])) {
        return {
          ...prev,
          [name]: checked
          ? [...prev[name], value]
          : prev[name].filter(v => v !== value)
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };
  
  return (
    <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={onSubmit}>
      <label htmlFor="title" className={`mt-3 ${formStyles.labelFormStyle}`}>
        Task Title
      </label>
      <input
        type="text"
        id="title"
        name="title"
        value={taskForm.title}
        onChange={handleTaskInputChange}
        placeholder="What needs to be done?"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.title && (
        <span className={formStyles.errorFormStyle}>
          {formError.title}
        </span>
      )}
      <label htmlFor="description" className={formStyles.labelFormStyle}>
        Description (optional)
      </label>
      <textarea
        id="description"
        name="description"
        value={taskForm.description}
        onChange={handleTaskInputChange}
        placeholder="Add more details..."
        rows="3"
        className={`${formStyles.inputFormStyle} resize-y min-h-20`}
      />
      {formError.description && (
        <span className={formStyles.errorFormStyle}>
          {formError.description}
        </span>
      )}
      <label htmlFor="due_date" className={formStyles.labelFormStyle}>
        Due Date
      </label>
      <input
        type="datetime-local"
        id="due_date"
        name="due_date"
        value={taskForm.due_date}
        onChange={handleTaskInputChange}
        required
        className={formStyles.inputFormStyle}
      />
      {formError.due_date && (
        <span className={formStyles.errorFormStyle}>
          {formError.due_date}
        </span>
      )}
      <div className="flex flex-wrap">
        <label htmlFor="tag" className={formStyles.labelFormStyle}>
          Tag
        </label>
        <input
          type="text"
          id="tag"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value.toLowerCase())}
          placeholder="Search tags"
          className={formStyles.inputFormStyle}
        />
        <div className="flex flex-wrap gap-2 mt-3 max-h-28 overflow-y-auto">
          {sortedTags.filter(t => t.name.includes(tagSearch)).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() =>
                setSelectedTagIds((prev) =>
                  prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                )
              }
              className={`px-2.5 py-1 border rounded-full text-sm cursor-pointer
                ${selectedTagIds.includes(tag.id)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 border-gray-300'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="w-full py-3 rounded bg-blue-700 hover:bg-blue-900 text-white font-bold cursor-pointer transition">
        {editingId ? 'Update Task' : 'Add Task'}
      </button>
    </form>
  );
}

export default TaskForm;