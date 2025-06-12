// Alignment needs to be formatted for Windows (stuck at left alignment)

import React, { useState } from 'react';
import CalendarIcon from '../components/CalendarIcon'; 
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';


const COLORS = {
  orange: '#ff8937',
  navy: '#003e83',
  navy90: '#00408d',
  gray300: '#d7dce2',
  gray500: '#8f98a3',
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
  left: {
    flex: '0 0 520px',
    textAlign: 'left',
  },
  right: {
    flex: '0 0 600px', 
  },
  brandSection: {
    textAlign: 'center',
    width: '100%',
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: 800,
    color: COLORS.navy,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 18,
    color: COLORS.navy,
    lineHeight: 1.6,
    marginTop: 18,
  },
  card: {
    background: COLORS.white,
    borderRadius: 16,
    padding: 48, 
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    border: `1px solid ${COLORS.gray300}`,
    width: '100%',
    boxSizing: 'border-box',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.navy,
    margin: '0 0 28px 0',
    textAlign: 'center', 
  },
  label: {
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.navy,
    marginBottom: 6,
    display: 'block',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    maxWidth: 480,
    padding: '14px 20px',
    borderRadius: 9999,
    border: `1px solid ${COLORS.gray300}`,
    fontSize: 16,
    outline: 'none',

    margin: '6px 0 20px 0',
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 480,
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.navy,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: 20,
    transition: 'background 0.2s',
  },
  secondaryBtn: {
    width: '100%',
    maxWidth: 480,
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: 500,
    fontFamily: '"Montserrat", sans-serif',
    textTransform: 'none',
    border: `1px solid ${COLORS.navy}`,
    cursor: 'pointer',
    marginTop: 12,
    transition: 'background 0.2s, color 0.2s',
  },
  or: {
    textAlign: 'center',
    margin: '24px 0 4px',
    fontWeight: 400,
    color: COLORS.navy,
  },
};

if (window.matchMedia('(max-width: 900px)').matches) {
  styles.container.flexDirection = 'column';
  styles.container.gap = 40;
  styles.left.textAlign = 'center';
  styles.right.flex = '1 1 auto';
  styles.input.maxWidth = '100%';
  styles.primaryBtn.maxWidth = '100%';
  styles.secondaryBtn.maxWidth = '100%';
}

export default function Login() {
  const navigate = useNavigate();
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
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* brand / welcome */}
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
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Login</h2>

            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              name="username"
              value={creds.username}
              onChange={e => setCreds({ ...creds, username: e.target.value })}
              placeholder="Enter your username"
              style={styles.input}
            />

            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={creds.password}
              onChange={e => setCreds({ ...creds, password: e.target.value })}
              placeholder="Enter your password"
              style={styles.input}
            />

            {error && <p style={{ color: 'red', marginTop: 0 }}>{error}</p>}

            <button onClick={handleLogin} type="button" style={styles.primaryBtn}>
              Log In
            </button>

            <div style={styles.or}>Or</div>

            <button
              onClick={() => navigate('/register')}
              type="button"
              style={styles.secondaryBtn}
            >
              Request a New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
