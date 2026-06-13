// src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CalendarIcon from '../components/CalendarIcon';
import { AuthContext } from '../AuthContext';
import api from '../api';
import PasswordField from '../components/PasswordField';
import { Settings } from 'lucide-react';
import { setAdminSetupSession } from '../adminSetupAuth';
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
  adminBtn: {
    width: '100%',
    maxWidth: 536,
    padding: '12px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: '"Montserrat", sans-serif',
    border: `1px solid ${COLORS.gray300}`,
    cursor: 'pointer',
    marginTop: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background .2s, border-color .2s',
  },
  gateBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, .45)',
    zIndex: 1000,
  },
  gateModal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(440px, calc(100vw - 32px))',
    background: COLORS.white,
    borderRadius: 8,
    padding: 28,
    boxShadow: '0 20px 48px rgba(0, 0, 0, .22)',
    zIndex: 1001,
    boxSizing: 'border-box',
  },
  gateTitle: {
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: 700,
    margin: '0 0 20px',
    textAlign: 'center',
  },
  gateActions: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
  },
  gateCancelBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: '"Montserrat", sans-serif',
    border: `1px solid ${COLORS.gray300}`,
    cursor: 'pointer',
  },
  gateSubmitBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 9999,
    background: COLORS.navy,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: '"Montserrat", sans-serif',
    border: 'none',
    cursor: 'pointer',
  },
  notice: {
    margin: '0 0 18px',
    color: COLORS.navy,
    background: '#eef6ff',
    border: '1px solid #b8d7f5',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
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
  styles.adminBtn.maxWidth = '100%';
}

export default function Login() {
  const navigate  = useNavigate();
  const location = useLocation();
  const { setIsAuth } = useContext(AuthContext);

  const [creds, setCreds] = useState({ username: '', password: '' });
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [error, setError] = useState('');
  const [adminError, setAdminError] = useState('');

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

  const openAdminGate = () => {
    setAdminCreds({ username: '', password: '' });
    setAdminError('');
    setShowAdminGate(true);
  };

  const closeAdminGate = () => {
    setShowAdminGate(false);
    setAdminError('');
  };

  const handleAdminLogin = async event => {
    event.preventDefault();
    setAdminError('');

    try {
      const { data } = await api.post('/api/admin/login', adminCreds);
      setAdminSetupSession(data.token);
      navigate('/admincreatecouncil');
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Invalid admin credentials');
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
          <div className="card">
            <h2 style={styles.cardTitle}>Login</h2>

            {location.state?.notice && (
              <p style={styles.notice}>{location.state.notice}</p>
            )}

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

            <button
              type="button"
              onClick={openAdminGate}
              style={styles.adminBtn}
              className="btn-secondary"
            >
              <Settings size={18} strokeWidth={2.2} />
              Configure Class Councils
            </button>
          </div>
        </div>
      </div>

      {showAdminGate && (
        <>
          <div style={styles.gateBackdrop} onClick={closeAdminGate} />
          <form style={styles.gateModal} onSubmit={handleAdminLogin}>
            <h2 style={styles.gateTitle}>Configure Class Councils</h2>

            <label htmlFor="admin-username" style={styles.label}>Username</label>
            <input
              id="admin-username"
              name="admin-username"
              className="input-field"
              placeholder="Enter admin username"
              value={adminCreds.username}
              onChange={e => setAdminCreds({ ...adminCreds, username: e.target.value })}
            />

            <label htmlFor="admin-password" style={styles.label}>Password</label>
            <PasswordField
              id="admin-password"
              name="admin-password"
              className="input-field"
              placeholder="Enter admin password"
              value={adminCreds.password}
              onChange={e => setAdminCreds({ ...adminCreds, password: e.target.value })}
            />

            {adminError && <p style={{ color: 'red', marginTop: 0 }}>{adminError}</p>}

            <div style={styles.gateActions}>
              <button type="button" onClick={closeAdminGate} style={styles.gateCancelBtn}>
                Cancel
              </button>
              <button type="submit" style={styles.gateSubmitBtn}>
                Enter
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
