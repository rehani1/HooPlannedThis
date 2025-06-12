import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import api from '../api';
import '../components/RegisterAccount.css';  // keeps layout & button rules
import '../styles/forms.css';               // ← NEW: shared form controls

export default function RegisterAccount() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    classId: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <CalendarIcon />
        <span className="brand-text">HooPlannedThis</span>
      </div>

      <div className="register-card">
        <h1>Request an Account</h1>
        <form onSubmit={handleSubmit}>
          {[
            { id: 'firstName', label: 'First Name', type: 'text' },
            { id: 'lastName', label: 'Last Name', type: 'text' },
            { id: 'username', label: 'Username', type: 'text' },
            { id: 'password', label: 'Password', type: 'password' },
            { id: 'email', label: 'Email', type: 'email' },
            { id: 'classId', label: 'Class ID', type: 'text' },
          ].map(({ id, label, type }) => (
            <div className="form-group" key={id}>
              <label htmlFor={id}>{label}</label>
              <input
                id={id}
                name={id}
                type={type}
                className="input-field"
                placeholder={`Enter your ${label.toLowerCase()}`}
                value={formData[id]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <button type="submit">Register</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}
