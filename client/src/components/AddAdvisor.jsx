import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AddressPicker from '../components/AddressPicker';

const defaultAdvisor = {
  firstName: '',
  lastName: '',
  building: '',
  address: '',
  latitude: '',
  longitude: '',
  email: '',
  phone: '',
  photoUrl: '', // will hold a data‑URL or remote path
};

/**
 * CreateAdvisorModal
 * A fully self‑contained modal that collects advisor details and returns
 * a populated advisor object via onSave().
 */
export default function CreateAdvisorModal({ isOpen, onClose, onSave, initial = defaultAdvisor }) {
  const [preview, setPreview] = useState('');
  const [form, setForm] = useState(initial);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { if (isOpen) setForm(initial); }, [isOpen, initial]);

  /* helpers */
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePhoto  = e => {
    const f = e.target.files[0];
    if (!f) return;
    const imgURL = URL.createObjectURL(f);
    setPreview(imgURL);
    setForm(p => ({ ...p, photoUrl: imgURL }));
  };
  const handleLocSelect = ({ address, latitude, longitude }) =>
    setForm(p => ({ ...p, address, latitude, longitude }));

  const save = () => {
    if (!form.firstName || !form.lastName) return alert('First and last name required');
    onSave({ ...form, id: Date.now() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ marginTop:0 }}>New Advisor</h2>

        <label style={styles.label}>First Name</label>
        <input name="firstName" value={form.firstName} onChange={handleChange} style={styles.input}/>

        <label style={styles.label}>Last Name</label>
        <input name="lastName" value={form.lastName} onChange={handleChange} style={styles.input}/>

        <label style={styles.label}>Building</label>
        <input name="building" value={form.building} onChange={handleChange} style={styles.input}/>

        <label style={styles.label}>Address</label>
        <div style={{ display:'flex', gap:8 }}>
          <input name="address" value={form.address} readOnly style={{ ...styles.input, flex:1 }}/>
          <button type="button" onClick={() => setShowPicker(true)} style={styles.pinBtn}>📍</button>
        </div>

        <label style={styles.label}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input}/>

        <label style={styles.label}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} style={styles.input}/>

        <label style={styles.label}>Profile Picture</label>
        <input type="file" accept="image/*" onChange={handlePhoto} style={styles.file}/>
        {preview && <img src={preview} alt="preview" style={styles.preview}/>}

        <div style={{ textAlign:'right', marginTop:24 }}>
          <button onClick={onClose} style={styles.cancel}>Cancel</button>
          <button onClick={save} style={styles.save}>Save</button>
        </div>
      </div>

      {/* nested AddressPicker overlay */}
      <AddressPicker isOpen={showPicker} onClose={() => setShowPicker(false)} onSelect={handleLocSelect} />
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
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 },
  modal:{ background:'#fff', padding:28, borderRadius:10, width:460, maxHeight:'80vh', overflowY:'auto',zIndex:2001 },
  label:{ display:'block', fontWeight:600, margin:'14px 0 6px' },
  input:{ width:'100%', padding:10, fontSize:16, border:'1px solid #ccc', borderRadius:6 },
  pinBtn:{ padding:'0 12px', border:'1px solid #ccc', borderRadius:6, cursor:'pointer' },
  file:{ marginTop:4 },
  preview:{ width:120, height:150, objectFit:'cover', borderRadius:6, marginTop:10, border:'2px solid #ddd' },
  cancel:{ marginRight:14, padding:'10px 22px', border:'1px solid #888', background:'#fff', cursor:'pointer', borderRadius:6 },
  save:{ padding:'10px 24px', border:'none', background:'#ff8937', color:'#fff', cursor:'pointer', borderRadius:6 },
};
