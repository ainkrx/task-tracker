import { useState } from 'react';
import api from '../api/client';
import * as formStyles from '../styles/formStyles';

function Login({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState({});

  const handleLoginInputChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      const { access_token } = (await api.post('/login', loginForm)).data;
      localStorage.setItem('access_token', access_token);
      onLoginSuccess?.(access_token);
    } catch (err) {
      console.error('Error logging in:', err);
      alert('Failed to log in');
      if (err.response?.status === 401) {
        setFormError({
          email: 'Invalid email or password.',
          password: 'Invalid email or password.',
        });
      }
    }
  };
  return (
    <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={handleLogin}>
      <label htmlFor="email" className={`mt-3 ${formStyles.labelFormStyle}`}>
        Email
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={loginForm.email}
        onChange={handleLoginInputChange}
        placeholder="you@example.com"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.email && (
        <span className={formStyles.errorFormStyle}>
          {formError.email}
        </span>
      )}
      <label htmlFor="password" className={formStyles.labelFormStyle}>
        Password
      </label>
      <input
        type="password"
        id="password"
        name="password"
        value={loginForm.password}
        onChange={handleLoginInputChange}
        placeholder="Enter your password"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.password && (
        <span className={formStyles.errorFormStyle}>
          {formError.password}
        </span>
      )}
      <button type="submit" className="w-full py-3 rounded bg-blue-700 hover:bg-blue-900 text-white font-bold cursor-pointer transition">
        Log In
      </button>
    </form>
  );
}

export default Login;