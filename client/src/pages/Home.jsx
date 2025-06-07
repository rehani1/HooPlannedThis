import React from 'react';
import NavBar from '../components/NavBar'; // adjust path if needed

const Home = () => {
  return (
    <div style={{ display: 'flex' }}>
      <NavBar />
      <div style={{ flexGrow: 1, padding: '20px' }}>
        <h1>Welcome to HooPlannedThis</h1>
        <p>This is the home page.</p>
      </div>
    </div>
  );
};

export default Home;
