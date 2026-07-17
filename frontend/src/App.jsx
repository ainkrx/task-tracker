import { useState, useEffect } from 'react';
import './App.css';
import api from './api/client';
import Tasks from './pages/Tasks';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [userName, setUserName] = useState('');
  const [view, setView] = useState('tasks');

  useEffect(() => {
    if (!token) {
      setUserName('');
      return;
    }
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    const timeLeft = exp * 1000 - Date.now();
    if (timeLeft <= 0) {
      localStorage.removeItem('access_token');
      window.location.reload();
      return;
    }
    const timer = setTimeout(() => {
      localStorage.removeItem('access_token');
      window.location.reload();
    }, timeLeft);
    api.get('/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => setUserName(res.data.name))
      .catch(() => {
        localStorage.removeItem('access_token');
        window.location.reload();
      }
    );
    return () => clearTimeout(timer);
  }, [token]);

  const handleLoginSuccess = (accessToken) => {
    setToken(accessToken);
    setView('tasks');
  };

  const handleRegisterSuccess = () => {
    setView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.reload();
  };
  return (
    <>
      <Navbar
        userName={userName}
        onHome={() => setView('tasks')}
        onLogin={() => setView('login')}
        onRegister={() => setView('register')}
        onSettings={() => setView('profile')}
        onLogout={handleLogout}
      />
      <main>
        <div className="max-w-4xl mx-auto p-20">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-space-grotesk tracking-wide text-blue-900 font-bold">
              📝 Task Tracker
            </h1>
            <p className="font-space-grotesk text-blue-700">
              Organize your day, one task at a time
            </p>
          </header>
          {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
          {view === 'register' && <Register onRegisterSuccess={handleRegisterSuccess} />}
          {view === 'tasks' && <Tasks token={token} />}
        </div>
      </main>
    </>
  );
}

export default App;
