import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [sortedTags, setSortedTags] = useState([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    completed: false,
    due_date: '',
  });
  const [tagForm, setTagForm] = useState({
    name: '',
  });
  const [formError, setFormError] = useState({});
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [filterTagIds, setFilterTagIds] = useState([]);
  const [manageTagMode, setManageTagMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);
  const taskFormRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, []);

  useEffect(() => {
    setSortedTags([...tags].sort((a, b) => a.name.localeCompare(b.name)));
  }, [tags]);

  const fetchTags = async () => {
    try {
      let tags = (await axios.get(`${API_BASE_URL}/tags/`)).data;
      setTags(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      let tasks = (await axios.get(`${API_BASE_URL}/tasks/`)).data;
      setTasks(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleTagInputChange = (event) => {
    const { name, value } = event.target;
    setTagForm((prev) => ({
      ...prev,
      [name]: value.toLowerCase(),
    }));
  };

  const createTask = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let newTask = (await axios.post(`${API_BASE_URL}/tasks/`, taskForm)).data;
      if (selectedTagIds.length > 0) {
        newTask = (await axios.post(`${API_BASE_URL}/tasks/${newTask.id}/tags`, selectedTagIds)).data;
      }
      setTaskForm({
        title: '',
        description: '',
        completed: false,
        due_date: ''
      });
      setTasks([...tasks, newTask]);
      setSelectedTagIds([]);
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task');
      const errors = {};
      err.response?.data?.detail?.forEach(d => {
        errors[d.loc[1]] = d.msg;
      });
      setFormError(errors);
    }
  };

  const startEditTask = (task) => {
    setEditTaskId(task.id);
    setShowTagForm(false);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
      due_date: task.due_date.slice(0, 16),
    });
    setSelectedTagIds(task.tags.map((tag) => tag.id));
    taskFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateTask = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let updatedTask = (await axios.put(`${API_BASE_URL}/tasks/${editTaskId}`, taskForm)).data;
      const originalTask = tasks.find((task) => task.id === editTaskId);
      const originalTagIds = originalTask ? originalTask.tags.map((tag) => tag.id) : [];
      const tagToAdd = selectedTagIds.filter((id) => !originalTagIds.includes(id));
      const tagToRemove = originalTagIds.filter((id) => !selectedTagIds.includes(id));
      if (tagToAdd.length > 0) {
        updatedTask = (await axios.post(`${API_BASE_URL}/tasks/${editTaskId}/tags`, tagToAdd)).data;
      }
      if (tagToRemove.length > 0) {
        updatedTask = (await axios.delete(`${API_BASE_URL}/tasks/${editTaskId}/tags`, { data: tagToRemove })).data;
      }
      setTaskForm({
        title: '',
        description: '',
        completed: false,
        due_date: ''
      });
      setTasks(tasks.map((task) => (task.id === editTaskId ? updatedTask : task)));
      setEditTaskId(null);
      setSelectedTagIds([]);
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
      const errors = {};
      err.response?.data?.detail?.forEach(d => {
        errors[d.loc[1]] = d.msg;
      });
      setFormError(errors);
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const updateData = {
        completed: !currentStatus,
      };
      let updatedTask = (await axios.put(`${API_BASE_URL}/tasks/${taskId}`, updateData)).data;
      setTasks(tasks.map((task) => task.id === taskId ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };
  
  const backButton = () => {
    if (!window.confirm('Are you sure? All changes will be lost.')) {
      return;
    }
    setFormError({});
    setTaskForm({
      title: '',
      description: '',
      completed: false,
      due_date: ''
    });
    setTagForm({
      name: ''
    });
    setEditTaskId(null);
    setSelectedTagIds([]);
  };

  const createTag = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let newTag = (await axios.post(`${API_BASE_URL}/tags/`, tagForm)).data;
      setTagForm({
        name: ''
      });
      setTags((prev) => [...prev, newTag]);
    } catch (err) {
      if (err.response?.status === 409) {
        alert('That tag name already exists.');
      } else {
        const errors = {};
        err.response?.data?.detail?.forEach((d) => { errors[d.loc[1]] = d.msg; });
        setFormError(errors);
        console.error('Error creating tag:', err);
        alert('Failed to create tag');
      }
    }
  };

  const updateTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to rename this tag? This action will also apply to all tasks associated with this tag.')) {
      return;
    }
    try {
      let updatedTag = (await axios.put(`${API_BASE_URL}/tags/${tagId}`, tagForm)).data;
      setTags(tags.map((tag) => tag.id === tagId ? updatedTag : tag));
      fetchTasks();
    } catch (err) {
      if (err.response?.status === 409) {
        alert('That tag name already exists.');
      } else {
        console.error('Error updating tag:', err);
        alert('Failed to update tag');
      }
    }
  };

  const deleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This action will also remove this tag from all associated tasks.')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/tags/${tagId}`);
      setTags(tags.filter((tag) => tag.id !== tagId));
      setFilterTagIds((prev) => prev.filter((id) => id !== tagId));
      fetchTasks();
    } catch (err) {
      console.error('Error deleting tag:', err);
      alert('Failed to delete tag');
    }
  };

  const handleTagFilter = (tagId) => {
    setFilterTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const getVisibleTasks = () => {
    const sortByDue = (a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.due_date) - new Date(b.due_date);
    };
    const matchesStatus = (task) => {
      if (statusFilter === 'all') return true;
      const isOverdue = !task.completed && new Date(task.due_date) < new Date();
      if (statusFilter === 'completed') return task.completed;
      if (statusFilter === 'overdue') return isOverdue;
      if (statusFilter === 'ongoing') return !task.completed && !isOverdue;
    };
    if (filterTagIds.length === 0) return [...tasks].sort(sortByDue).filter(matchesStatus);
    return tasks.filter((task) => {
      const taskTagIds = task.tags.map((tag) => tag.id);
      return filterTagIds.every((id) => taskTagIds.includes(id));
    }).sort(sortByDue).filter(matchesStatus);
  };

  const labelFormStyle = "block mb-2 font-medium";
  const inputFormStyle = "w-full px-4 py-2 border-2 border-gray-300 rounded transition-colors duration-500 focus:outline-none focus:border-sky-300";
  const errorFormStyle = "block text-red-500 text-xs -mt-2";
  const actionBtnStyle = "px-4 py-2 rounded text-xs text-white cursor-pointer transition";

  return (
    <div className="max-w-4xl mx-auto p-20">
      <header className="text-center mb-10">
        <h1 className="text-4xl text-blue-900 font-bold">
          📝 Task Tracker
        </h1>
        <p className="text-blue-700">
          Organize your day, one task at a time
        </p>
      </header>
      <div className="relative" ref={taskFormRef}>
        <div className="absolute left-full top-5 flex flex-col gap-5">
          <button 
            type="button" 
            onClick={() => setShowTagForm(false)} disabled={!showTagForm}
            className={`rounded-r-lg px-5 py-1.5 text-sm shadow-md transition
              ${!showTagForm 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Add Task
          </button>
          <button 
            type="button" 
            onClick={() => setShowTagForm(true)} disabled={showTagForm}
            className={`rounded-r-lg px-2 py-1.5 text-sm shadow-md transition 
              ${showTagForm 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Add Tag
          </button>
        </div>
        {!showTagForm && (
          <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={editTaskId ? updateTask : createTask}>
            {editTaskId && (
              <button
                type="button"
                onClick={backButton}
                className="absolute top-3 left-3 px-3 py-1 rounded text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-pointer transition"
              >
                ← Back
              </button>
            )}
            <label htmlFor="title" className={`mt-3 ${labelFormStyle}`}>
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
              className={inputFormStyle}
            />
            {formError.title && 
            <span className={errorFormStyle}>
              {formError.title}
            </span>}
            <label htmlFor="description" className={labelFormStyle}>
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={taskForm.description}
              onChange={handleTaskInputChange}
              placeholder="Add more details..."
              rows="3"
              className={`${inputFormStyle} resize-y min-h-20`}
            />
            {formError.description && 
            <span className={errorFormStyle}>
              {formError.description}
            </span>}
            <label htmlFor="due_date" className={labelFormStyle}>
              Due Date
            </label>
            <input
              type="datetime-local"
              id="due_date"
              name="due_date"
              value={taskForm.due_date}
              onChange={handleTaskInputChange}
              required
              className={inputFormStyle}
            />
            {formError.due_date && 
            <span className={errorFormStyle}>
              {formError.due_date}
            </span>}
            <div className="flex flex-wrap">
              <label htmlFor="tag" className={labelFormStyle}>
                Tag
              </label>
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value.toLowerCase())}
                placeholder="Search tags"
                className={inputFormStyle}
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
              {editTaskId ? 'Update Task' : 'Add Task'}
            </button>
          </form>
        )}
        {showTagForm && (
          <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={createTag}>
            <label htmlFor="tagName" className={`mt-3 ${labelFormStyle}`}>
              Tag Name
            </label>
            <input
              type="text"
              id="tagName"
              name="name"
              value={tagForm.name}
              onChange={handleTagInputChange}
              placeholder="One word that reminds you of the task"
              required
              className={inputFormStyle}
            />
            {formError.name &&
            <span className={errorFormStyle}>
              {formError.name}
            </span>}
            <button type="submit" className="w-full py-3 rounded bg-blue-700 hover:bg-blue-900 text-white font-bold cursor-pointer transition">
              Add Tag
            </button>
          </form>
        )}
      </div>
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
        <label htmlFor="tag" className={labelFormStyle}>
          {manageTagMode ? 'Manage Tags' : 'Filter Tags'}
        </label>
        <input
          type="text"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value.toLowerCase())}
          placeholder="Search task based on tag"
          className={inputFormStyle}
        />
        <div className="flex flex-wrap gap-2 mt-3 max-h-28 overflow-y-auto">
          {sortedTags.filter(t => t.name.includes(tagSearch)).map((tag) => (
            <span key={tag.id} className={`flex items-center gap-1 px-2.5 py-1 border rounded-full text-sm cursor-pointer 
              ${filterTagIds.includes(tag.id)
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-sky-50 text-sky-700 border-gray-300'
            }`}
              onClick={() => handleTagFilter(tag.id)}
            >
              #{tag.name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }}
                className={`text-red-500 cursor-pointer transition-all duration-150 
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
              ${statusFilter === status ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {status}
          </button>
        ))}
      </div>
      {error ? (
        <div className="bg-pink-200 text-red-500 px-5 py-4 rounded mb-5 border-l-4 border-red-500">
          ❌ {error}
        </div>
      ) : (
        loading ? (
          <div className="text-center p-10 text-gray-800">⏳ Loading tasks...</div>
        ) : (
          getVisibleTasks().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-7xl mb-2.5">🎉</div>
              <div className="text-2xl font-bold">No tasks yet!</div>
              Add your first task to get started.
            </div>
          ) : (
            <ul className="task-list">
              {getVisibleTasks().map((task) => (
                <li
                  key={task.id}
                  className={`bg-white p-5 rounded-xl shadow mb-5 flex items-center transition hover:-translate-y-1 hover:shadow-lg 
                    ${task.completed ? 'opacity-80' : ''} 
                    ${!task.completed && new Date(task.due_date) < new Date() ? 'border-l-4 border-red-500' : ''}
                  `}
                >
                  <div className="flex-1">
                    <h3 className={`text-xl font-medium mb-1 
                      ${task.completed ? 'line-through text-gray-500' : ''}
                      `}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-base">
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
                  </div>
                  <p className={`text-sm mr-2.5 
                    ${!task.completed && new Date(task.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-slate-600'}
                    `}
                  >
                    {task.completed
                      ? `✅ Done ${new Date(task.due_date).toLocaleString().slice(0, -3)}`
                      : new Date(task.due_date) < new Date()
                      ? `⚠️ Overdue ${new Date(task.due_date).toLocaleString().slice(0, -3)}`
                      : `📅 Due ${new Date(task.due_date).toLocaleString().slice(0, -3)}`
                    }
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      className={`${actionBtnStyle} bg-amber-600 hover:bg-amber-800`}
                      onClick={() => startEditTask(task)}
                    >
                      ✏️ <span className="btn-label">Edit</span>
                    </button>
                    <button
                      className={`${actionBtnStyle} bg-green-600 hover:bg-green-800`}
                      onClick={() => toggleTaskCompletion(task.id, task.completed)}
                    >
                      {task.completed ? '↩️ ' : '✅ '}
                      <span className="btn-label">
                        {task.completed ? 'Undo' : 'Complete'}
                      </span>
                    </button>
                    <button
                      className={`${actionBtnStyle} bg-red-600 hover:bg-red-800`}
                      onClick={() => deleteTask(task.id)}
                    >
                      🗑️ {" "}
                      <span className="btn-label">
                        Delete
                      </span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )
      )}
    </div>
  );
}

export default App
