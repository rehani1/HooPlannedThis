
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DEFAULT_ADVISOR_FORM = {
  firstName: '',
  lastName: '',
  building: '',
  address: '',
  email: '',
  phone: ''
};

function advisorFormFromInitial(initial = {}) {
  const source = initial || {};
  return Object.fromEntries(
    Object.keys(DEFAULT_ADVISOR_FORM).map(key => [key, source[key] ?? ''])
  );
}

function CreateAdvisorModal({ isOpen, onClose, onSave, initial, mode }) {
  const [form, setForm] = useState(advisorFormFromInitial(initial));

  useEffect(() => {
    if (isOpen) setForm(advisorFormFromInitial(initial));
  }, [initial, isOpen]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = event => {
    event.preventDefault();

    const payload = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim(),
      building:  form.building.trim(),
      address:   form.address.trim(),
      phone:     form.phone.trim(),
    };

    if (!payload.firstName || !payload.lastName || !payload.email) {
      alert('First name, last name, and email are required');
      return;
    }

    onSave(payload);
  };

  if (!isOpen) return null;
  return (
    <div style={styles.overlay} onClick={onClose}>
      <form style={styles.modal} onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2 style={{marginTop:0}}>{mode === 'edit' ? 'Edit Advisor' : 'New Advisor'}</h2>

        <label htmlFor="advisor-first-name" style={styles.label}>First Name *</label>
        <input
          id="advisor-first-name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <label htmlFor="advisor-last-name" style={styles.label}>Last Name *</label>
        <input
          id="advisor-last-name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <label htmlFor="advisor-email" style={styles.label}>Email *</label>
        <input
          id="advisor-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          style={styles.input}
          required
        />

        <label htmlFor="advisor-building" style={styles.label}>Building</label>
        <input
          id="advisor-building"
          name="building"
          value={form.building}
          onChange={handleChange}
          style={styles.input}
        />

        <label htmlFor="advisor-address" style={styles.label}>Address</label>
        <input
          id="advisor-address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Street, City, State, Zip"
          style={styles.input}
        />

        <label htmlFor="advisor-phone" style={styles.label}>Phone</label>
        <input
          id="advisor-phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          style={styles.input}
        />

        <div style={{ textAlign:'right', marginTop:24 }}>
          <button type="button" onClick={onClose} style={styles.cancel}>Cancel</button>
          <button type="submit" style={styles.save}>
            {mode === 'edit' ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

CreateAdvisorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initial: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
};

/** Main component: list + “Add Advisor” button + modal */
export default function AddAdvisor({ onAdvisorCreated, onAdvisorUpdated, authToken }) {
  const [advisors, setAdvisors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/advisors`)
      .then(r => r.json())
      .then(setAdvisors)
      .catch(e => console.error('GET /api/advisors', e));
  }, []);

  const openCreateModal = () => {
    setEditingAdvisor(null);
    setShowModal(true);
  };

  const openEditModal = advisor => {
    setEditingAdvisor(advisor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdvisor(null);
  };

  const handleSave = async payload => {
    const isEditing = Boolean(editingAdvisor);
    const url = isEditing
      ? `${API_BASE}/api/advisors/${editingAdvisor.id}`
      : `${API_BASE}/api/advisors`;

    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      const advisor = { ...payload, id: data.id || editingAdvisor?.id };

      if (isEditing) {
        setAdvisors(list => list.map(item => item.id === advisor.id ? advisor : item));
        onAdvisorUpdated?.(advisor);
      } else {
        setAdvisors(list => [...list, advisor]);
        onAdvisorCreated?.(advisor);
      }

      closeModal();
    } catch (err) {
      console.error(`${isEditing ? 'PUT' : 'POST'} /api/advisors`, err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Advisors</h2>
        <button type="button" onClick={openCreateModal} style={styles.addBtn}>
          + Add Advisor
        </button>
      </div>

      <CreateAdvisorModal
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleSave}
        initial={editingAdvisor}
        mode={editingAdvisor ? 'edit' : 'create'}
      />

      {advisors.length ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Building</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {advisors.map(advisor => (
                <tr key={advisor.id}>
                  <td style={styles.td}>{advisor.firstName} {advisor.lastName}</td>
                  <td style={styles.td}>{advisor.email}</td>
                  <td style={styles.td}>{advisor.building || '-'}</td>
                  <td style={styles.td}>{advisor.phone || '-'}</td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => openEditModal(advisor)} style={styles.editBtn}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={styles.emptyText}>No advisors yet.</p>
      )}
    </div>
  );
}

AddAdvisor.propTypes = {
  onAdvisorCreated: PropTypes.func,
  onAdvisorUpdated: PropTypes.func,
  authToken: PropTypes.string,
};

/** Inline styles */
const styles = {
  wrapper: {
    marginTop: 0
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16
  },
  title: {
    margin: 0,
    color: '#003e83',
    fontSize: 24,
    fontWeight: 700
  },
  addBtn: {
    background: '#4b77d1', color: '#fff',
    padding: '10px 20px', border: 'none',
    borderRadius: 6, cursor: 'pointer',
    fontSize: 16
  },
  overlay: {
    position:'fixed', inset:0,
    background:'rgba(0,0,0,.45)',
    display:'flex', justifyContent:'center', alignItems:'center',
    zIndex:2000
  },
  modal: {
    background:'#fff', padding:28, borderRadius:10,
    width:'min(460px, calc(100vw - 32px))',
    boxSizing:'border-box',
    maxHeight:'80vh', overflowY:'auto', zIndex:2001
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #ddd' },
  th: { background: '#f7f7f7', fontWeight: 600, padding: 10, border: '1px solid #ddd', textAlign: 'left' },
  td: { padding: 10, border: '1px solid #ddd' },
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
  },
  editBtn: {
    background: '#fff',
    color: '#003e83',
    border: '1px solid #d7dce2',
    cursor: 'pointer',
    padding: '7px 12px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600
  },
  emptyText: { margin: 0, color: '#4d5b6a' }
};
