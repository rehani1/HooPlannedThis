// ── src/pages/RegisterAccount.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import api from '../api';
import { ArrowLeft } from 'lucide-react';
import '../components/RegisterAccount.css';
import '../styles/forms.css';

const roleOptions = [
  { value: 'president',       label: 'President' },
  { value: 'vice_president',  label: 'Vice President' },
  { value: 'secretary',       label: 'Secretary' },
  { value: 'treasurer',       label: 'Treasurer' },
  { value: 'committee_chair', label: 'Committee Chair' },
  { value: 'general_body',    label: 'General Body Member' },
];

export default function RegisterAccount() {
  /* councils arrive from admin page */
  const [councils, setCouncils]           = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [committeeOptions, setCommitteeOptions] = useState([]);

  /* form model */
  const [formData, setFormData] = useState({
    firstName:'', lastName:'', email:'', classId:'',
    username:'', password:'',
    academicYear:'',       // chosen year
    role:'',                // chosen role
    committee:'',           // chosen committee (or exec)
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/councils'); // [{ id,councilType,acadYear,committees }]
        setCouncils(data);
        setAcademicYears([...new Set(data.map(c => c.acadYear))].sort());
      } catch (err) {
        console.error('GET /api/councils failed', err);
      }
    })();
  }, []);

  const handleChange = e =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleYearSelect = e => {
    const academicYear = e.target.value;
    const yearCouncils = councils
      .filter(c => c.acadYear === academicYear)
      .map(c => c.councilType.replace(/\b\w/g,l=>l.toUpperCase()));

    setCommitteeOptions([
      'Not in Committee – Pres / VP / Treas / Exec',
      ...yearCouncils,
    ]);

    setFormData(p => ({
      ...p,
      academicYear,
      committee: '',           // reset until user picks
    }));
  };

  /* submit registration */
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/register', formData); // adjust endpoint payload as needed
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      {/* brand header */}
      <div className="register-header">
        <div className="register-header">
            <Link to="/login" className="back-arrow" aria-label="Back to login">
            <ArrowLeft size={24} strokeWidth={2.2} />
            </Link>
        </div>
        <CalendarIcon />
        <span className="brand-text">HooPlannedThis</span>
      </div>

      <div className="register-card">
        <h1>Request an Account</h1>

        <form onSubmit={handleSubmit}>
        {/* row 1: first + last name */}
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

          {/* row 2: computing ID + grad year */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Computing ID</label>
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

          {/* row 3: password + uva email */}
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

          {/* row 4: academic year + role */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="academicYear">Academic Year</label>
              <select
                id="academicYear" name="academicYear"
                className="input-field"
                value={formData.academicYear}
                onChange={handleYearSelect} required
              >
                <option value="" disabled>Select academic year…</option>
                {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
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

          {/* single full‑width row: committee */}
          <div className="form-group">
            <label htmlFor="committee">Committee (Council)</label>
            <select
              id="committee" name="committee"
              className="input-field"
              value={formData.committee}
              onChange={handleChange}
              disabled={!formData.academicYear}
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
