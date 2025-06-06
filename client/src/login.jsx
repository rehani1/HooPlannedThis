import React from 'react';

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
  },
  left: {
    flex: '0 0 460px',
    paddingRight: 60,
  },
  right: {
    flex: '0 0 460px',
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
    fontSize: 20,
    fontWeight: 500,
    color: COLORS.gray500,
    lineHeight: 1.35,
    margin: '28px 0 0 0',
  },
  card: {
    background: COLORS.white,
    borderRadius: 16,
    padding: '48px 60px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    border: `1px solid ${COLORS.gray300}`,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.navy,
    margin: '0 0 36px 0',
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.navy,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 9999,
    border: `1px solid ${COLORS.gray300}`,
    fontSize: 16,
    outline: 'none',
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.navy,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: 12,
    transition: 'background 0.2s',
  },
  secondaryBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 9999,
    background: COLORS.white,
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: 600,
    border: `2px solid ${COLORS.navy}`,
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

const IconComponent = () => (
  <svg style={styles.icon} viewBox="0 0 448 512" aria-hidden="true">
    <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6 5.4 12 12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6 5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6 5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6 5.4 12 12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4 12 12 12h40c6.6 0 12 5.4 12 12v40c0 6.6 5.4 12 12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z" />
  </svg>
);

function Login({ onSuccess, Icon = IconComponent }) {
  const handleLogin = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <h1 style={styles.brandTitle}>
          <Icon />
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
          <button type="button" style={styles.secondaryBtn}>Request a New Account</button>
        </div>
      </div>
    </div>
  );
}

Login.defaultProps = {
  Icon: IconComponent,
};

export default Login;
