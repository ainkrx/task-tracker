import { useState } from 'react';
import api from '../api/client';
import * as formStyles from '../styles/formStyles';

function Register({ onRegisterSuccess }) {
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState({});

  const handleRegisterInputChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setFormError({});
    try {
      await api.post('/register', registerForm);
      setRegisterForm({ name: '', email: '', password: '' });
      onRegisterSuccess?.();
    } catch (err) {
      if (err.response?.status === 409) {
        alert('That email is already registered.');
      } else {
        console.error('Error registering:', err);
        alert('Failed to register');
        const errors = {};
        err.response?.data?.detail?.forEach((d) => { errors[d.loc[1]] = d.msg; });
        setFormError(errors);
      }
    }
  };

  return (
    <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={handleRegister}>
      <label htmlFor="name" className={`mt-3 ${formStyles.labelFormStyle}`}>
        Name
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={registerForm.name}
        onChange={handleRegisterInputChange}
        placeholder="Your name"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.name && (
        <span className={formStyles.errorFormStyle}>
          {formError.name}
        </span>
      )}
      <label htmlFor="email" className={formStyles.labelFormStyle}>
        Email
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={registerForm.email}
        onChange={handleRegisterInputChange}
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
        value={registerForm.password}
        onChange={handleRegisterInputChange}
        placeholder="At least 8 characters"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.password && (
        <span className={formStyles.errorFormStyle}>
          {formError.password}
        </span>
      )}
      <button type="submit" className="w-full py-3 rounded bg-blue-700 hover:bg-blue-900 text-white font-bold cursor-pointer transition">
        Register
      </button>
    </form>
  );
}

export default Register;
