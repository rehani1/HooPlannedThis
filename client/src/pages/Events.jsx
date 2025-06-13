/* ── src/pages/Events.jsx ------------------------------------- */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Events() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      const url = `${API_BASE}/api/events?limit=3`;
      console.log('👉 Fetching events from:', url);

      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        console.log('← Status:', res.status, res.statusText);
        if (!res.ok) throw new Error(`Request failed ${res.status}`);

        const data = await res.json();
        console.log('← data:', data);
        setEvents(data);
      } catch (err) {
        console.error('❌ fetchEvents error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <div style={{ padding: '1rem' }}>
        <h1>Events Page</h1>
        <p>Below are your three most recent events.</p>

        {loading && <p>Loading…</p>}
        {error   && <p style={{ color: 'crimson' }}>Error: {error}</p>}

        {!loading && !error && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {events.length === 0 && <li>No recent events found.</li>}
            {events.map(evt => (
              <li key={evt.event_id}
                  style={{
                    border: '1px solid #e2e2e2',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}>
                <h2 style={{ margin: 0 }}>{evt.name}</h2>
                <small style={{ color: '#666' }}>
                  {new Date(`${evt.event_date}T${evt.event_time}`)
                    .toLocaleString()}
                </small>
                <p style={{ marginTop: 8 }}>{evt.description}</p>
              </li>
            ))}
          </ul>
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
