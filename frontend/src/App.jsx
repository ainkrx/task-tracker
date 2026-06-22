import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
// Axios is like a messenger that carries data between frontend and backend
import axios from 'axios';

// The address of the backend server.
const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tasks, setTasks] = useState([]);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    completed: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/tasks/`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prevState) => {
      if (type === 'checkbox' && Array.isArray(prevState[name])) {
        return {
          ...prevState,
          [name]: checked
            ? [...prevState[name], value]
            : prevState[name].filter(v => v !== value)
        };
      }
      return {
        ...prevState,
        [name]: value
      };
    });
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!formState.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/`, formState);
      setTasks([...tasks, response.data]);
      setFormState({
        title: '',
        description: '',
        completed: false
      });
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Failed to add task');
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const updateData = {
        completed: !currentStatus,
      }; 
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, updateData);
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? response.data : task
        )
      );
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
      setTasks(
        tasks.filter((task) => 
          task.id !== taskId
        )
      );
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Task Tracker</h1>
        <p>Organize your day, one task at a time</p>
      </header>

      <form className="task-form" onSubmit={addTask}>
        <div className="form-group">
          <label htmlFor="title">Task Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            placeholder="What needs to be done?"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            value={formState.description}
            onChange={handleInputChange}
            placeholder="Add more details..."
            rows="3"
          />
        </div>

        <button type="submit" className="submit-btn">
          Add Task
        </button>
      </form>
      {error && <div className="error">❌ {error}</div>}
      {loading ? (
        <div className="loading">⏳ Loading tasks...</div>
      ) : (
        tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">No tasks yet!</div>
            <div className="empty-state-subtext">
              Add your first task above to get started.
            </div>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                </div>

                <div className="task-actions">
                  <button
                    className="action-btn complete-btn"
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                  >
                    {task.completed ? '↩️ ' : '✅ '} 
                    <span className='btn-label'>{task.completed ? 'Undo' : 'Complete'}</span>
                  </button>

                  {/* Delete button */}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteTask(task.id)}
                  >
                    🗑️ <span className='btn-label'>Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

export default App
