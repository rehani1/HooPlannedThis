// ── src/pages/AdminCreateCouncil.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';

/* ──────────────────────────────────────────
   Centred‑modal helper
   ────────────────────────────────────────── */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div style={modal.backdrop} onClick={onClose} />
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </>
  );
}

/* ──────────────────────────────────────────
   Page
   ────────────────────────────────────────── */
export default function AdminCreateCouncil() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    councilType: '',
    yearFrom: '',
    yearTo: '',
    gradYear: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const save = () => {
    console.log('new council data', form); // TODO: replace with real API
    setShow(false);
  };

  return (
    <Layout>
      <h1 style={s.h1}>Admin Create Council Page</h1>
      <p style={{ textAlign: 'center', marginBottom: 32 }}>
        This is where your Admin Page will be.
      </p>

      <div style={{ textAlign: 'center' }}>
        <button style={s.createBtn} onClick={() => setShow(true)}>
          + Create New Council
        </button>
      </div>

      {/* ───────────────────────── POP‑UP ───────────────────────── */}
      <Modal open={show} onClose={() => setShow(false)}>
        <h2 style={{ marginTop: 0 }}>New Council</h2>

        {/* Council type */}
        <label style={s.label}>Council Type</label>
        <select
          name="councilType"
          value={form.councilType}
          onChange={handleChange}
          style={s.select}
        >
          <option value="" disabled>
            Choose…
          </option>
          <option value="first">First‑Year Council</option>
          <option value="second">Second‑Year Council</option>
          <option value="third">Third‑Year Council</option>
          <option value="trustees">Trustees</option>
        </select>

        {/* Graduation year */}
        <label style={s.label}>Council Graduation Year</label>
        <input
          type="number"
          name="gradYear"
          value={form.gradYear}
          onChange={handleChange}
          placeholder="2028"
          style={s.gradYearInput}
        />

        {/* Academic year range */}
        <label style={s.label}>Academic Year</label>
        <div style={s.yearRow}>
          <input
            type="number"
            name="yearFrom"
            value={form.yearFrom}
            onChange={handleChange}
            placeholder="2025"
            style={s.yearInput}
          />
          <span style={s.dash}> – </span>
          <input
            type="number"
            name="yearTo"
            value={form.yearTo}
            onChange={handleChange}
            placeholder="2026"
            style={s.yearInput}
          />
        </div>

        {/* Buttons */}
        <div style={{ textAlign: 'right', marginTop: 26 }}>
          <button onClick={() => setShow(false)} style={s.cancel}>
            Cancel
          </button>
          <button onClick={save} style={s.save}>
            Save
          </button>
        </div>
      </Modal>
    </Layout>
  );
}

/* ──────────────────────────────────────────
   Styles
   ────────────────────────────────────────── */
const s = {
  h1: {
    textAlign: 'center',
    margin: '24px 0 8px',
    fontSize: 40,
    fontWeight: 700
  },
  createBtn: {
    background: '#a45614',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    fontSize: 18,
    cursor: 'pointer',
    borderRadius: 6
  },
  label: {
    display: 'block',
    fontWeight: 600,
    margin: '18px 0 6px',
    textAlign: 'left'
  },
  select: {
    display:'block',
    width: '50%',
    padding: 10,
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff'
  },
  yearRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dash: { fontWeight: 700 },

  yearInput: {
    width: 90,
    padding: 8,
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 6
  },
  gradYearInput: {
        display:'block',        /* ← forces new line & left‑flush */
        width:'100%',           /* fill the column */
        maxWidth:90,           /* but not crazy‑wide */
        padding:8,
        fontSize:16,
        border:'1px solid #ccc',
        borderRadius:6
      },

  cancel: {
    marginRight: 14,
    padding: '10px 22px',
    border: '1px solid #888',
    background: '#fff',
    cursor: 'pointer',
    borderRadius: 6
  },
  save: {
    padding: '10px 24px',
    border: 'none',
    background: '#ff8937',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: 6
  }
};

/* Centred‑modal shared styles */
const modal = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.45)',
    zIndex: 1000
  },
  box: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    padding: 28,
    borderRadius: 10,
    width: 420,
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 1001
  }
};
