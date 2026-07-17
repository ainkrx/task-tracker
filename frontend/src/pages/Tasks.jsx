import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import TaskForm from '../components/TaskForm';
import TagForm from '../components/TagForm';
import TagFilterBar from '../components/TagFilterBar';
import TaskList from '../components/TaskList';

const ONE_DAY_MS = 24*60*60*1000;
const daysFromNow = (days) => new Date(Date.now() + days * ONE_DAY_MS).toISOString();
const DUMMY_TAGS = [
  { id: -1, name: 'work' },
  { id: -2, name: 'school' },
  { id: -3, name: 'urgent' },
];
const DUMMY_TASKS = [
  {
    id: -1,
    title: 'Sample Task',
    description: 'This is a preview task for guests.',
    completed: false,
    due_date: daysFromNow(1), // ongoing
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[1]],
    created_at: daysFromNow(-1),
  },
  {
    id: -2,
    title: 'Finish Report',
    description: 'This task is overdue.',
    completed: false,
    due_date: daysFromNow(-2), // overdue
    tags: [DUMMY_TAGS[0], DUMMY_TAGS[2]],
    created_at: daysFromNow(-4),
  },
  {
    id: -3,
    title: 'Submit Homework',
    description: 'This task is already done.',
    completed: true,
    due_date: daysFromNow(-5), // completed
    tags: [DUMMY_TAGS[1], DUMMY_TAGS[2]],
    created_at: daysFromNow(-7),
  },
];

function Tasks({ token }) {
  const isGuest = !token;
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
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, [token]);

  useEffect(() => {
    setSortedTags([...tags].sort((a, b) => a.name.localeCompare(b.name)));
  }, [tags]);

  const fetchTasks = async () => {
    if (isGuest) {
      setTasks(DUMMY_TASKS);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let tasks = (await api.get(`/tasks/`)).data;
      setTasks(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTags = async () => {
    if (isGuest) {
      setTags(DUMMY_TAGS);
      return;
    }
    try {
      let tags = (await api.get(`/tags/`)).data;
      setTags(tags);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let newTask = (await api.post(`/tasks/`, taskForm)).data;
      if (selectedTagIds.length > 0) {
        newTask = (await api.post(`/tasks/${newTask.id}/tags`, selectedTagIds)).data;
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
    setEditingId(task.id);
    setShowTagForm(false);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      completed: task.completed,
      due_date: task.due_date.slice(0, 16),
    });
    setSelectedTagIds(task.tags.map((tag) => tag.id));
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateTask = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let updatedTask = (await api.put(`/tasks/${editingId}`, taskForm)).data;
      const originalTask = tasks.find((task) => task.id === editingId);
      const originalTagIds = originalTask ? originalTask.tags.map((tag) => tag.id) : [];
      const tagToAdd = selectedTagIds.filter((id) => !originalTagIds.includes(id));
      const tagToRemove = originalTagIds.filter((id) => !selectedTagIds.includes(id));
      if (tagToAdd.length > 0) {
        updatedTask = (await api.post(`/tasks/${editingId}/tags`, tagToAdd)).data;
      }
      if (tagToRemove.length > 0) {
        updatedTask = (await api.delete(`/tasks/${editingId}/tags`, { data: tagToRemove })).data;
      }
      setTaskForm({
        title: '',
        description: '',
        completed: false,
        due_date: ''
      });
      setTasks(tasks.map((task) => (task.id === editingId ? updatedTask : task)));
      setEditingId(null);
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
      let updatedTask = (await api.put(`/tasks/${taskId}`, updateData)).data;
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
      await api.delete(`/tasks/${taskId}`);
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
    setEditingId(null);
    setSelectedTagIds([]);
  };

  const createTag = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      let newTag = (await api.post(`/tags/`, tagForm)).data;
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

  const startEditTag = (tag) => {
    setEditingId(tag.id);
    setShowTagForm(true);
    setTagForm({
      name: tag.name,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateTag = async (event) => {
    event.preventDefault();
    setFormError({});
    if (!window.confirm('Are you sure you want to rename this tag? This action will also apply to all tasks associated with this tag.')) {
      return;
    }
    try {
      let updatedTag = (await api.put(`/tags/${editingId}`, tagForm)).data;
      setTagForm({
        name: ''
      });
      setTags(tags.map((tag) => tag.id === editingId ? updatedTag : tag));
      setTasks(tasks.map((task) => ({
        ...task,
        tags: task.tags.map((tag) => (tag.id === editingId ? updatedTag : tag))
      })));
      setEditingId(null);
    } catch (err) {
      if (err.response?.status === 409) {
        alert('That tag name already exists.');
      } else {
        console.error('Error updating tag:', err);
        alert('Failed to update tag');
        const errors = {};
        err.response?.data?.detail?.forEach(d => {
          errors[d.loc[1]] = d.msg;
        });
        setFormError(errors);
      }
    }
  };

  const deleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This action will also remove this tag from all associated tasks.')) {
      return;
    }
    try {
      await api.delete(`/tags/${tagId}`);
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

  return (
    <>
      {isGuest && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 text-sm rounded-lg px-4 py-2 mb-4 text-center">
          You're viewing sample data as a guest. Any attempt to add, edit, or delete will fail. <br />
          Log in to make changes.
        </div>
      )}
      <div className="relative" ref={formRef}>
        <div className="absolute left-full top-5 flex flex-col gap-5">
          <button
            type="button"
            onClick={() => { setShowTagForm(false); setEditingId(null); }} disabled={!showTagForm}
            className={`rounded-r-lg px-5 py-1.5 text-sm shadow-md transition
              ${!showTagForm
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Add Task
          </button>
          <button
            type="button"
            onClick={() => { setShowTagForm(true); setEditingId(null); }} disabled={showTagForm}
            className={`rounded-r-lg px-2 py-1.5 text-sm shadow-md transition
              ${showTagForm
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-900 text-white cursor-pointer'}
            `}>
            Add Tag
          </button>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={backButton}
            className="absolute top-3 left-3 px-3 py-1 rounded text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 cursor-pointer transition"
          >
            ← Back
          </button>
        )}
        {!showTagForm && (
          <TaskForm
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            formError={formError}
            editingId={editingId}
            onSubmit={editingId ? updateTask : createTask}
            sortedTags={sortedTags}
            tagSearch={tagSearch}
            setTagSearch={setTagSearch}
            selectedTagIds={selectedTagIds}
            setSelectedTagIds={setSelectedTagIds}
          />
        )}
        {showTagForm && (
          <TagForm
            tagForm={tagForm}
            setTagForm={setTagForm}
            formError={formError}
            editingId={editingId}
            onSubmit={editingId ? updateTag : createTag}
          />
        )}
      </div>
      <TagFilterBar
        manageTagMode={manageTagMode}
        setManageTagMode={setManageTagMode}
        tagSearch={tagSearch}
        setTagSearch={setTagSearch}
        sortedTags={sortedTags}
        filterTagIds={filterTagIds}
        handleTagFilter={handleTagFilter}
        startEditTag={startEditTag}
        deleteTag={deleteTag}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <TaskList
        error={error}
        loading={loading}
        tasks={getVisibleTasks()}
        startEditTask={startEditTask}
        toggleTaskCompletion={toggleTaskCompletion}
        deleteTask={deleteTask}
        handleTagFilter={handleTagFilter}
        filterTagIds={filterTagIds}
      />
    </>
  );
}

export default Tasks;