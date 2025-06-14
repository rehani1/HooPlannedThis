import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import CalendarIcon from '../components/CalendarIcon';
import CalendarComponent from '../components/CalendarComponent';

const Committees = () => {
  const [user, setUser] = useState({ committeeId: null, gradYear: null });

  useEffect(() => {
    // pull the user object you stored at login
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error('Could not parse user from localStorage', e);
      }
    }
  }, []);

  return (
    <Layout>
      <div style={{ padding: '1rem' }}>
        <h1>Committees Page</h1>

        <section style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #ddd' }}>
          <h2>Your Info</h2>
          <p>
            <strong>Committee ID:</strong>{' '}
            {user.committeeId !== null ? user.committeeId : 'Not set'}
          </p>
          <p>
            <strong>Graduation Year:</strong>{' '}
            {user.gradYear !== null ? user.gradYear : 'Not set'}
          </p>
        </section>

        <section>
          <p>This is where your Committees will be listed.</p>
          
        </section>

        
        
      </div>
    </Layout>
  );
};

export default Committees;
