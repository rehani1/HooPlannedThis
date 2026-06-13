// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import { AuthContext } from '../AuthContext';
import api from '../api';
import PasswordField from '../components/PasswordField';
import '../styles/forms.css';          

const COLORS = {
  orange: '#ff8937',
  navy: '#003e83',
  navy90: '#00408d',
  gray300: '#d7dce2',
  white: '#ffffff',
};

const styles = {
  icon: {
    color: COLORS.orange,
    fill: COLORS.orange,
    fontSize: 42,
    width: 42,
    height: 48,
    marginRight: 16,
    flexShrink: 0,
  },
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Montserrat", sans-serif',
    padding: '40px 24px',
    background: COLORS.white,
    boxSizing: 'border-box',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 96,
  },
  left: { flex: '0 0 520px', textAlign: 'left' },
  right: { flex: '0 0 600px' },
  brandTitle: {
    fontSize: 48,
    fontWeight: 800,
    color: COLORS.navy,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  tagline: { fontSize: 18, color: COLORS.navy, lineHeight: 1.6, marginTop: 18 },
  cardTitle: { fontSize: 28, fontWeight: 700, color: COLORS.navy, margin: '0 0 28px', textAlign: 'center' },
  label: { fontSize: 18, fontWeight: 600, color: COLORS.navy, marginBottom: 12, display: 'block', textAlign: 'left' },
  primaryBtn: {
    width: '100%',
    maxWidth: 536,
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.navy,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 500,
    fontFamily: '"Montserrat", sans-serif',
    border: 'none',
    cursor: 'pointer',
    marginTop: 20,
    transition: 'background .2s',
  },
  secondaryBtn: {
    width: '100%',
    maxWidth: 536,
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: 500,
    fontFamily: '"Montserrat", sans-serif',
    border: `1px solid ${COLORS.navy}`,
    cursor: 'pointer',
    marginTop: 12,
    transition: 'background .2s, color .2s',
  },
  or: { textAlign: 'center', margin: '24px 0 4px', fontWeight: 500, color: COLORS.navy },
};

if (window.matchMedia('(max-width: 900px)').matches) {
  styles.container.flexDirection = 'column';
  styles.container.gap = 40;
  styles.left.textAlign = 'center';
  styles.right.flex = '1 1 auto';
  styles.primaryBtn.maxWidth = '100%';
  styles.secondaryBtn.maxWidth = '100%';
}

export default function Login() {
  const navigate  = useNavigate();
  const { setIsAuth } = useContext(AuthContext);

  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      const { data } = await api.post('/api/login', creds);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuth(true);
      navigate('/home', { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* brand */}
        <div style={styles.left}>
          <h1 style={styles.brandTitle}>
            <CalendarIcon style={styles.icon} />
            HooPlannedThis
          </h1>
          <p style={styles.tagline}>
            Welcome to HooPlannedThis.<br />
            Log in to coordinate your class events effortlessly.
          </p>
        </div>

        {/* login card */}
        <div style={styles.right}>
          <div div className="card">
            <h2 style={styles.cardTitle}>Login</h2>

            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              name="username"
              className="input-field"
              placeholder="Enter your username"
              value={creds.username}
              onChange={e => setCreds({ ...creds, username: e.target.value })}
            />

            <label htmlFor="password" style={styles.label}>Password</label>
            <PasswordField
              id="password"
              name="password"
              type="password"
              className="input-field"
              placeholder="Enter your password"
              value={creds.password}
              onChange={e => setCreds({ ...creds, password: e.target.value })}
            />

            {error && <p style={{ color: 'red', marginTop: 0 }}>{error}</p>}

            <button type="button" onClick={handleLogin} style={styles.primaryBtn} className="btn-primary">
              Log In
            </button>

            <div style={styles.or}>Or</div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              style={styles.secondaryBtn}
              className="btn-secondary"
            >
              Request a New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
