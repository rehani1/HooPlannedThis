// src/pages/Events.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const url = `${API_BASE}/api/events?limit=3`;
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Request failed ${res.status}`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Recent Events</h1>
        {loading && <p>Loading…</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {events.length === 0 && <p>No recent events found.</p>}
            {events.map(evt => (
              <article key={evt.event_id} style={{
                border: '1px solid #e2e2e2',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                background: '#fff'
              }}>
                <h2 style={{ margin: '0 0 0.5rem', color: '#333' }}>{evt.name}</h2>
                <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.9rem' }}>
                  <strong>Date:</strong>{' '}
                  {new Date(evt.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.9rem' }}>
                  <strong>Time:</strong>{' '}
                  {evt.event_time.slice(0,5)}
                </p>
                <p style={{ margin: '0 0 1rem', color: '#444' }}>{evt.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    Budget: ${evt.budget_allocated.toFixed(2)}
                  </span>
                  <span style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    Committee ID: {evt.committee_id}
                  </span>
                  {evt.location_id && (
                    <span style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      Location ID: {evt.location_id}
                    </span>
                  )}
                </div>
                <Link to={`/events/manage`} style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  color: '#ff8937',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Manage supplies →
                </Link>
              </article>
            ))}
          </div>
        )}

      


        <Link to="/events/createevent">
          <button style={{
            padding: '10px 20px',
            background: '#ff8937',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            borderRadius: 8,
            cursor: 'pointer',
            marginTop: 20,
          }}>
            + Create New Event
          </button>
        </Link>
      </div>
    </Layout>
  );
}
