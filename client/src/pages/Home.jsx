// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link }           from 'react-router-dom';
import Layout             from '../components/Layout';
import CalendarIcon       from '../components/CalendarIcon';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Home() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // today in YYYY-MM-DD
        const today = new Date().toISOString().slice(0,10);
        // assuming your API supports filtering/sorting:
        const url = `${API_BASE}/api/events?start_date=${today}&sort=asc&limit=3`;
        const res = await fetch(url, { headers:{ Accept:'application/json' }});
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        setEvents(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <h1 style={{ display:'flex', alignItems:'center', gap:8 }}>
        <CalendarIcon /> Welcome to HooPlannedThis!
      </h1>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Upcoming Events
        </h2>

        {loading && <p>Loading upcoming events…</p>}
        {error   && <p style={{ color:'crimson' }}>Error: {error}</p>}

        {!loading && !error && (
          events.length === 0
            ? <p>No upcoming events.</p>
            : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}>
                {events.map(evt => (
                  <article key={evt.event_id} style={{
                    border: '1px solid #e2e2e2',
                    borderRadius: '8px',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    background: '#fff'
                  }}>
                    <h3 style={{ margin: '0 0 .5rem', color: '#333' }}>
                      {evt.name}
                    </h3>
                    <p style={{ margin:'0 0 .5rem', color:'#666', fontSize:'0.9rem' }}>
                      <strong>Date:</strong>{' '}
                      {new Date(evt.event_date)
                        .toLocaleDateString(undefined,{
                          weekday:'short',month:'short',day:'numeric',year:'numeric'
                        })}
                    </p>
                    <p style={{ margin:'0 0 .5rem', color:'#666', fontSize:'0.9rem' }}>
                      <strong>Time:</strong>{' '}
                      {evt.event_time.slice(0,5)}
                    </p>
                    <p style={{ margin:'0 0 1rem', color:'#444' }}>
                      {evt.description}
                    </p>
                    <Link to={`/events/manage/${evt.event_id}`} style={{
                      display: 'inline-block',
                      color: '#ff8937',
                      fontWeight: 'bold',
                      textDecoration: 'none'
                    }}>
                      Manage supplies →
                    </Link>
                  </article>
                ))}
              </div>
            )
        )}
      </section>
    </Layout>
  );
}
