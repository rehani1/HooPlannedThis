// src/components/AddAdvisor.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_URL || '';

/** Modal for creating a new advisor */
function CreateAdvisorModal({ isOpen, onClose, onSave, initial }) {
  const defaultForm = initial || {
    firstName: '', lastName: '',
    building: '', address: '',
    email: '', phone: ''
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) setForm(defaultForm);
  }, [isOpen]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = () => {
    if (!form.firstName || !form.lastName) {
      alert('First and last name required');
      return;
    }
    const payload = {
      firstName: form.firstName,
      lastName:  form.lastName,
      building:  form.building,
      address:   form.address,
      email:     form.email,
      phone:     form.phone,
    };
    console.log('🛰️ CreateAdvisor payload →', payload);
    onSave(payload);
  };

  if (!isOpen) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{marginTop:0}}>New Advisor</h2>

        <label style={styles.label}>First Name *</label>
        <input name="firstName" value={form.firstName} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Last Name *</label>
        <input name="lastName" value={form.lastName} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Building</label>
        <input name="building" value={form.building} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Address</label>
        <input name="address" value={form.address} onChange={handleChange}
               placeholder="Street, City, State, Zip" style={styles.input} />

        <label style={styles.label}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} style={styles.input} />

        <div style={{ textAlign:'right', marginTop:24 }}>
          <button onClick={onClose} style={styles.cancel}>Cancel</button>
          <button onClick={save}    style={styles.save}>Save</button>
        </div>
      </div>
    </div>
  );
}

CreateAdvisorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initial: PropTypes.object,
};

/** Main component: list + “Add Advisor” button + modal */
export default function AddAdvisor() {
  const [advisors, setAdvisors] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/advisors`)
      .then(r => r.json())
      .then(setAdvisors)
      .catch(e => console.error('❌ GET /api/advisors', e));
  }, []);

  const handleSave = async payload => {
    try {
      const res = await fetch(`${API_BASE}/api/advisors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('📡 Response status:', res.status, res.statusText);
      const text = await res.text();
      console.log('📡 Response body:', text);
      if (!res.ok) throw new Error(text || res.status);
      const { id } = JSON.parse(text);
      setAdvisors(a => [...a, { ...payload, id }]);
      setShowModal(false);
    } catch (err) {
      console.error('❌ POST /api/advisors', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <button onClick={()=>setShowModal(true)} style={styles.addBtn}>
        + Add New Advisor
      </button>

      <CreateAdvisorModal
        isOpen={showModal}
        onClose={()=>setShowModal(false)}
        onSave={handleSave}
      />

      <h3 style={{ marginTop:24 }}>Current Advisors</h3>
      <ul>
        {advisors.map(a => (
          <li key={a.id}>
            {a.firstName} {a.lastName} — {a.building} — {a.address}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Inline styles */
const styles = {
  addBtn: {
    background: '#4b77d1', color: '#fff',
    padding: '10px 20px', border: 'none',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 16, marginBottom: 16
  },
  overlay: {
    position:'fixed', inset:0,
    background:'rgba(0,0,0,.45)',
    display:'flex', justifyContent:'center', alignItems:'center',
    zIndex:2000
  },
  modal: {
    background:'#fff', padding:28, borderRadius:10,
    width:460, maxHeight:'80vh', overflowY:'auto', zIndex:2001
  },
  label: { display:'block', fontWeight:600, margin:'14px 0 6px' },
  input: {
    width:'100%', padding:10, fontSize:16,
    border:'1px solid #ccc', borderRadius:6,
    marginBottom:12
  },
  cancel: {
    marginRight:14, padding:'10px 22px',
    border:'1px solid #888', background:'#fff',
    cursor:'pointer', borderRadius:6
  },
  save: {
    padding:'10px 24px', border:'none',
    background:'#ff8937', color:'#fff',
    cursor:'pointer', borderRadius:6
  }
};
