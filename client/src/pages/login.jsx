
import React from 'react';
import CalendarIcon from '../components/CalendarIcon'; 
import { useNavigate } from 'react-router-dom';


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
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 40px',
  },
  left: {
    // flex: '0 0 460px',
    // paddingRight: 60,
    flex: 1,
    maxWidth: 520,
    paddingRight: 40,
  },
  right: {
    // flex: '0 0 460px',
    flex: 1,
    maxWidth: 480,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: 800,
    color: COLORS.navy,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: 400,
    color: COLORS.navy,
    lineHeight: 1.6,
    margin: '16px 0 0 0',
    textAlign: 'left',
  },
  card: {
    background: COLORS.white,
    borderRadius: 20,
    padding: '40px 48px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    border: `1px solid ${COLORS.gray300}`,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.navy,
    margin: '0 0 36px 0',
    textAlign: 'left',
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
    padding: '14px 20px',
    borderRadius: 9999,
    border: `1px solid ${COLORS.gray300}`,
    fontSize: 16,
    outline: 'none',
    marginBottom: 20,
    marginTop: 6,
  },
  primaryBtn: {
    width: '100%',
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
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: 500,
    textTransform: 'none',
    border: `1px solid ${COLORS.navy}`,
    cursor: 'pointer',
    marginTop: 12,
    transition: 'background 0.2s, color 0.2s',
  },
  or: {
    textAlign: 'center',
    margin: '24px 0 4px',
    fontWeight: 600,
    color: COLORS.gray500,
  },
};

function Login() {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate('/home');
    
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
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
        <div style={styles.right}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Login</h2>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input id="username" type="text" placeholder="Enter your username" style={styles.input} />
            <label htmlFor="password" style={styles.label}>Password</label>
            <input id="password" type="password" placeholder="Enter your password" style={styles.input} />
            <button onClick={handleLogin} type="button" style={styles.primaryBtn}>Log In</button>
            <div style={styles.or}>Or</div>
            <button onClick={handleRegister} type="button" style={styles.secondaryBtn}>Request a New Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;



