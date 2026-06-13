// ── src/pages/RegisterAccount.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import { ArrowLeft } from 'lucide-react';
import '../components/RegisterAccount.css';
import '../styles/forms.css';


const API_BASE = import.meta.env.VITE_API_URL || '';

const roleOptions = [
  { value: 'president',       label: 'President' },
  { value: 'vice_president',  label: 'Vice President' },
  { value: 'secretary',       label: 'Secretary' },
  { value: 'treasurer',       label: 'Treasurer' },
  { value: 'committee_chair', label: 'Committee Chair' },
  { value: 'general_body',    label: 'General Body Member' },
];


export default function RegisterAccount() {
  const [committeeOptions, setCommitteeOptions] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    username: '', password: '',
    classId: '', academicYearStart: '', academicYearEnd: '',
    role: '', committee: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  
  const academicYear =
    formData.academicYearStart && formData.academicYearEnd
      ? `${formData.academicYearStart.trim()}-${formData.academicYearEnd.trim()}`
      : '';

  const hasFullYears =
    /^\d{4}$/.test(formData.academicYearStart.trim()) &&
    /^\d{4}$/.test(formData.academicYearEnd.trim());

  
  useEffect(() => {
    if (!hasFullYears || !formData.classId.trim()) {
      setCommitteeOptions([]);
      return;
    }

    async function fetchCommittees() {
      const url = `${API_BASE}/api/committees` +
                  `?academicYear=${encodeURIComponent(academicYear)}` +
                  `&gradYear=${encodeURIComponent(formData.classId.trim())}`;

      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Request failed ${res.status}`);

        const data = await res.json();

        const list = Array.isArray(data) ? data : [data];

        setCommitteeOptions([
          'Not in Committee – Pres / VP / Treas / Exec',
          ...list.map(c => c.committee_name ?? c)
        ]);
      } catch (err) {
        console.error(' fetchCommittees error:', err);
        setCommitteeOptions([]);
      }
    }

    fetchCommittees();
  }, [academicYear, formData.classId, hasFullYears]);

  
  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, academicYear })
      });
      if (!res.ok) {
        const msg = (await res.json())?.message ?? res.statusText;
        throw new Error(msg);
      }
      navigate('/login', {
        state: { notice: 'Account request submitted. An admin must approve it before you can log in.' },
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  
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

          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
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

          
          <div className="form-row">
            <div className="form-group">
              <label>Academic Year</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text" name="academicYearStart"
                  placeholder="e.g., 2025"
                  className="input-field"
                  value={formData.academicYearStart}
                  onChange={handleChange}
                  required
                />
                <span className="year-dash">–</span>
                <input
                  type="text" name="academicYearEnd"
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

          
          <div className="form-group">
            <label htmlFor="committee">Committee (Council)</label>
            <select
              id="committee" name="committee"
              className="input-field"
              value={formData.committee}
              onChange={handleChange}
              disabled={!hasFullYears || !formData.classId.trim()}
              required
            >
              <option value="" disabled>Select committee…</option>
              {committeeOptions.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button type="submit">Submit Request</button>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}
