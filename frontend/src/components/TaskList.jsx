import * as formStyles from '../styles/formStyles';

function TaskList({
  error,
  loading,
  tasks,
  startEditTask,
  toggleTaskCompletion,
  deleteTask,
  handleTagFilter,
  filterTagIds,
}) {
  if (error) {
    return (
      <div className="bg-pink-200 text-red-500 px-5 py-4 rounded mb-5 border-l-4 border-red-500">
        ❌ {error}
      </div>
    );
  } else if (loading) {
    return <div className="text-center p-10 text-gray-800">⏳ Loading tasks...</div>;
  } else if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-7xl mb-2.5">🎉</div>
        <div className="text-2xl font-bold">No tasks yet!</div>
        Add your first task to get started.
      </div>
    );
  } else {
    return (
      <ul className="task-list">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={`bg-white p-5 rounded-xl shadow mb-5 transition hover:-translate-y-1 hover:shadow-lg border-l-4
              ${task.completed ? 'opacity-80' : ''}
              ${!task.completed && new Date(task.due_date) < new Date() ? 'border-red-500' : 'border-white'}
            `}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className={`text-xl font-medium mb-1
                  ${task.completed ? 'line-through text-gray-500' : ''}
                  `}
                >
                  {task.title}
                </h3>
              </div>
              <p className={`text-sm mr-2.5 text-right
                ${!task.completed && new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-slate-600'}
                `}
              >
                {task.completed
                  ? `✅ Done` : new Date(task.due_date) < new Date()
                  ? `⚠️ Overdue`
                  : `📅 Due`
                }
                <br></br>{new Date(task.due_date).toLocaleString().slice(0, -3)}
              </p>
              <div className="flex gap-2.5">
                <button
                  className={`${formStyles.actionBtnStyle} bg-amber-600 hover:bg-amber-800`}
                  onClick={() => startEditTask(task)}
                >
                  ✏️ <span className="btn-label">Edit</span>
                </button>
                <button
                  className={`${formStyles.actionBtnStyle} bg-green-600 hover:bg-green-800`}
                  onClick={() => toggleTaskCompletion(task.id, task.completed)}
                >
                  {task.completed ? '↩️ ' : '✅ '}
                  <span className="btn-label">
                    {task.completed ? 'Undo' : 'Done'}
                  </span>
                </button>
                <button
                  className={`${formStyles.actionBtnStyle} bg-red-600 hover:bg-red-800`}
                  onClick={() => deleteTask(task.id)}
                >
                  🗑️ {" "}
                  <span className="btn-label">
                    Delete
                  </span>
                </button>
              </div>
            </div>
            {task.description && (
              <p className="text-base max-w-[55%]">
                {task.description}
              </p>
            )}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[...task.tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagFilter(tag.id)}
                    className={`px-2.5 py-1 border rounded-full text-sm cursor-pointer
                      ${filterTagIds.includes(tag.id)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-sky-50 text-sky-700 border-gray-300'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }
}

export default TaskList;