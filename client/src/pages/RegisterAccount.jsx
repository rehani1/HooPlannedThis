// ── src/pages/RegisterAccount.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import '../components/RegisterAccount.css';
import '../styles/forms.css';

/* fixed roles */
const roleOptions = [
  { value: 'president',       label: 'President' },
  { value: 'vice_president',  label: 'Vice President' },
  { value: 'secretary',       label: 'Secretary' },
  { value: 'treasurer',       label: 'Treasurer' },
  { value: 'committee_chair', label: 'Committee Chair' },
  { value: 'general_body',    label: 'General Body Member' },
];

export default function RegisterAccount() {
  /* ---------------------------------------------------------- */
  /*  form + ui state                                           */
  /* ---------------------------------------------------------- */
  const [committeeOptions, setCommitteeOptions] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    username: '', password: '',
    classId: '',                 // graduation year
    academicYearStart: '',       // e.g. 2025
    academicYearEnd:   '',       // e.g. 2026
    role: '', committee: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /* ---------------------------------------------------------- */
  /*  derived academicYear value                                */
  /* ---------------------------------------------------------- */
  const academicYear =
    formData.academicYearStart && formData.academicYearEnd
      ? `${formData.academicYearStart.trim()}-${formData.academicYearEnd.trim()}`
      : '';

  /* ---------------------------------------------------------- */
  /*  fetch committees when academicYear & gradYear ready       */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    if (!academicYear || !formData.classId) {
      setCommitteeOptions([]);
      return;
    }

    const fetchCommittees = async () => {
      try {
        const { data } = await api.get('/api/committees', {
          params: { academicYear, gradYear: formData.classId }
        });
        setCommitteeOptions([
          'Not in Committee – Pres / VP / Treas / Exec',
          ...data.map(c => c.committee_name ?? c)
        ]);
      } catch (err) {
        console.error('Failed to fetch committees', err);
        setCommitteeOptions([]);
      }
    };

    fetchCommittees();
  }, [academicYear, formData.classId]);

  /* ---------------------------------------------------------- */
  /*  handlers                                                  */
  /* ---------------------------------------------------------- */
  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/register', { ...formData, academicYear });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  /* ---------------------------------------------------------- */
  /*  JSX                                                       */
  /* ---------------------------------------------------------- */
  return (
    <div className="register-container">
      <div className="register-header">
        <Link to="/login" className="back-arrow" aria-label="Back to login">
          <ArrowLeft size={24} strokeWidth={2.2} />
        </Link>
        <CalendarIcon />
        <span className="brand-text">HooPlannedThis</span>
      </div>

      <div className="register-card">
        <h1>Request an Account</h1>

        <form onSubmit={handleSubmit}>
          {/* ---- Row 1: name ---- */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName" name="firstName" type="text"
                className="input-field" placeholder="Enter your first name"
                value={formData.firstName} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName" name="lastName" type="text"
                className="input-field" placeholder="Enter your last name"
                value={formData.lastName} onChange={handleChange} required
              />
            </div>
          </div>

          {/* ---- Row 2: computing ID + grad year ---- */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Computing ID</label>
              <input
                id="username" name="username" type="text"
                className="input-field" placeholder="e.g., abc1de"
                value={formData.username} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="classId">Class Graduation Year</label>
              <input
                id="classId" name="classId" type="text"
                className="input-field" placeholder="e.g., 2027"
                value={formData.classId} onChange={handleChange} required
              />
            </div>
          </div>

          {/* ---- Row 3: password + email ---- */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="text"
                className="input-field" placeholder="Enter a password"
                value={formData.password} onChange={handleChange} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">UVA Email</label>
              <input
                id="email" name="email" type="email"
                className="input-field" placeholder="example@virginia.edu"
                value={formData.email} onChange={handleChange} required
              />
            </div>
          </div>

          {/* ---- Row 4: academic year + role ---- */}
          <div className="form-row">
            <div className="form-group">
              <label>Academic Year</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center'}}>
                <input
                  type="text"
                  name="academicYearStart"
                  placeholder="e.g., 2025"
                  className="input-field"
                  value={formData.academicYearStart}
                  onChange={handleChange}
                  required
                />
                <span className="year-dash">–</span>
                <input
                  type="text"
                  name="academicYearEnd"
                  placeholder="e.g., 2026"
                  className="input-field"
                  value={formData.academicYearEnd}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role" name="role"
                className="input-field"
                value={formData.role}
                onChange={handleChange} required
              >
                <option value="" disabled>Select role…</option>
                {roleOptions.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ---- Committee dropdown ---- */}
          <div className="form-group">
            <label htmlFor="committee">Committee (Council)</label>
            <select
              id="committee" name="committee"
              className="input-field"
              value={formData.committee}
              onChange={handleChange}
              disabled={!academicYear || !formData.classId}
              required
            >
              <option value="" disabled>Select committee…</option>
              {committeeOptions.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit">Register</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}
