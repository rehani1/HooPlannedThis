// ── src/pages/Advisors.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import '../styles/forms.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Advisors() {
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAdvisors() {
      const url = `${API_BASE}/api/advisors`;
      console.log(' Fetching advisors from:', url);
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Request failed ${res.status}`);
        const data = await res.json();
        setAdvisors(Array.isArray(data) ? data : [data]);
      } catch (err) {
        console.error('fetchAdvisors error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAdvisors();
  }, []);

  const renderCard = adv => (
    <div style={styles.cardWrapper} key={adv.id}>
      <div style={styles.leftCol}>
        {adv.photoUrl && <img src={adv.photoUrl} alt="avatar" style={styles.avatar} />}
      </div>
      <table style={styles.table}>
        <tbody>
          <tr><th style={styles.th}>First Name</th><td style={styles.td}>{adv.firstName}</td></tr>
          <tr><th style={styles.th}>Last Name</th> <td style={styles.td}>{adv.lastName}</td></tr>
          <tr><th style={styles.th}>Building</th>  <td style={styles.td}>{adv.building}</td></tr>
          <tr><th style={styles.th}>Address</th>   <td style={styles.td}>{adv.address}</td></tr>
          <tr><th style={styles.th}>Email</th>     <td style={styles.td}><a href={`mailto:${adv.email}`}>{adv.email}</a></td></tr>
          <tr><th style={styles.th}>Phone</th>     <td style={styles.td}>{adv.phone}</td></tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 10 }}>Advisors</h1>

        {loading && <p>Loading advisors…</p>}
        {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

        {!loading && !error && (
          <>
            <h2 style={styles.h2}>All Advisors</h2>
            {advisors.map(renderCard)}
          </>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  cardWrapper: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: '2em' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' },
  avatar: { width: 150, height: 188, objectFit: 'cover', borderRadius: 8, border: '3px solid #eee', flexShrink: 0 },
  table: { width: '100%', maxWidth: 600, borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd', borderRadius: 8 },
  th: { background: '#f7f7f7', fontWeight: 600, width: 180, padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' },
  td: { padding: 12, borderBottom: '1px solid #eee' },
  h2: { marginBottom: 12 }
};
