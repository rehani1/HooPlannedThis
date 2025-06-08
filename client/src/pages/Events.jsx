import React from 'react';
import { Link } from 'react-router-dom';
import CalendarComponent from '../components/CalendarComponent';

const Events = () => {
  return (
    <div>
      <h1>Events Page</h1>
      <p>This is where your events will be listed.</p>
      <CalendarComponent/>

      <Link to="/events/createevent">
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#ff8937',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}>
          + Create New Event
        </button>
      </Link>
    </div>
  );
};

export default Events;

