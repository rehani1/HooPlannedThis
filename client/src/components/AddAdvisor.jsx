import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const defaultAdvisor = {
  firstName: '',
  lastName: '',
  building: '',
  address: '',
  email: '',
  phone: '',
};

/**
 * CreateAdvisorModal
 * A modal that collects advisor details and returns
 * a payload matching the Advisor table via onSave().
 */
export default function CreateAdvisorModal({ isOpen, onClose, onSave, initial = defaultAdvisor }) {
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (isOpen) setForm(initial);
  }, [isOpen, initial]);

  /* helpers */
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const save = () => {
    if (!form.firstName || !form.lastName) {
      alert('First and last name required');
      return;
    }
    // Build payload to match Advisor table columns
    const payload = {
      advisor_first_name: form.firstName,
      advisor_last_name:  form.lastName,
      building_name:      form.building   || null,
      address:            form.address    || null,
      advisor_email:      form.email      || null,
      advisor_number:     form.phone      || null,
    };
    console.log('🛰️ CreateAdvisor payload →', payload);
    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>New Advisor</h2>

        <label style={styles.label}>First Name *</label>
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Last Name *</label>
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <label style={styles.label}>Building</label>
        <input
          name="building"
          value={form.building}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Street, City, State, Zip"
          style={styles.input}
        />

        <label style={styles.label}>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Phone</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          style={styles.input}
        />

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <button onClick={onClose} style={styles.cancel}>Cancel</button>
          <button onClick={save} style={styles.save}>Save</button>
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

/* inline styles */
const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  modal: {
    background: '#fff',
    padding: 28,
    borderRadius: 10,
    width: 460,
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 2001
  },
  label: { display: 'block', fontWeight: 600, margin: '14px 0 6px' },
  input: { width: '100%', padding: 10, fontSize: 16, border: '1px solid #ccc', borderRadius: 6 },
  cancel: { marginRight: 14, padding: '10px 22px', border: '1px solid #888', background: '#fff', cursor: 'pointer', borderRadius: 6 },
  save: { padding: '10px 24px', border: 'none', background: '#ff8937', color: '#fff', cursor: 'pointer', borderRadius: 6 }
};
