// ── src/pages/Advisors.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';
import AddressPicker from '../components/AddressPicker';
import firstToThirdAdvisorpfp from '../components/avatars/firstToThirdAdvisorpfp.jpeg';
import trusteesAdvisorpfp     from '../components/avatars/trusteesAdvisorpfp.jpeg';

/* ---------- tiny centered modal helper ---------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div style={modalStyles.backdrop} onClick={onClose} />
      <div style={modalStyles.box} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </>
  );
}


export default function Advisors() {
  /* ---------- static demo advisors ---------- */
  const earlyAdvisor = [{
    id: 1, firstName: 'Alice', lastName: 'Smith', building: 'Gilmer Hall',
    address: '485 McCormick Rd, Charlottesville VA 22903',
    email: 'alice.smith@virginia.edu', phone: '(434) 924‑1001',
    photoUrl: firstToThirdAdvisorpfp,
  }];
  const fourthYearAdvisor = [{
    id: 2, firstName: 'Carmen', lastName: 'Nguyen', building: 'Rice Hall',
    address: '85 Engineers Way, Charlottesville VA 22903',
    email: 'carmen.nguyen@virginia.edu', phone: '(434) 924‑1004',
    photoUrl: trusteesAdvisorpfp,
  }];

  /* ---------- mutating state ---------- */
  const [extraAdvisors, setExtraAdvisors] = useState([]); // new advisors go here

  const [showForm,      setShowForm]    = useState(false);
  const [showPicker,    setShowPicker]  = useState(false);
  const [preview,       setPreview]     = useState(null);
  const [form, setForm] = useState({
    firstName:'', lastName:'', building:'', address:'', latitude:'', longitude:'',
    email:'', phone:'', photo:null,
  });

  /* ---------- helpers ---------- */
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePhoto  = e => { const f=e.target.files[0]; if(!f) return; setForm(p=>({...p,photo:f})); setPreview(URL.createObjectURL(f)); };
  const handleLocSelect = ({ address, latitude, longitude }) =>
    setForm(p => ({ ...p, address, latitude, longitude }));

  const save = () => {
    const newAdv = { ...form, id: Date.now(), photoUrl: preview || undefined };
    setExtraAdvisors(a => [...a, newAdv]);
    setForm({ firstName:'', lastName:'', building:'', address:'', latitude:'', longitude:'', email:'', phone:'', photo:null });
    setPreview(null);
    setShowForm(false);
  };

  /* ---------- card renderer ---------- */
  const renderCard = adv => (
    <div style={styles.cardWrapper} key={adv.id}>
      <div style={styles.leftCol}>{adv.photoUrl && <img src={adv.photoUrl} alt="avatar" style={styles.avatar} />}</div>
      <table style={styles.table}>
        <tbody>
          <tr><th style={styles.th}>First Name</th><td style={styles.td}>{adv.firstName}</td></tr>
          <tr><th style={styles.th}>Last Name</th> <td style={styles.td}>{adv.lastName}</td></tr>
          <tr><th style={styles.th}>Building</th>  <td style={styles.td}>{adv.building}</td></tr>
          <tr><th style={styles.th}>Address</th>   <td style={styles.td}>{adv.address}</td></tr>
          <tr><th style={styles.th}>Email</th>     <td style={styles.td}><a href={`mailto:${adv.email}`}>{adv.email}</a></td></tr>
          <tr><th style={styles.th}>Phone</th>     <td style={styles.td}>{adv.phone}</td></tr>
        </tbody>
      </table>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <Layout>
      <div style={{ padding:40, maxWidth:900, margin:'0 auto' }}>
        <h1 style={{ marginBottom:10 }}>Advisors</h1>
        <button style={styles.newBtn} onClick={()=>setShowForm(true)}>＋ Add New Advisor</button>

        {/* existing two sections */}
        <h2 style={styles.h2}>Advisor for 1st – 3rd Years</h2>
        {earlyAdvisor.map(renderCard)}

        <h2 style={styles.h2}>Advisor for 4th Year Trustees</h2>
        {fourthYearAdvisor.map(renderCard)}

        {/* dynamically added advisors */}
        <h2 style={styles.h2}>Additional Advisors</h2>
        {extraAdvisors.length ? extraAdvisors.map(renderCard) : <p>No additional advisors yet.</p>}
      </div>

      {/* ---------- form modal ---------- */}
      <Modal open={showForm} onClose={()=>setShowForm(false)}>
        <h2 style={{ marginTop:0 }}>New Advisor</h2>
        <label style={styles.label}>First Name</label>
        <input name="firstName" value={form.firstName} onChange={handleChange} style={styles.input}/>
        <label style={styles.label}>Last Name</label>
        <input name="lastName" value={form.lastName} onChange={handleChange} style={styles.input}/>
        <label style={styles.label}>Building</label>
        <input name="building" value={form.building} onChange={handleChange} style={styles.input}/>
        <label style={styles.label}>Address</label>
        <div style={{ display:'flex', gap:8 }}>
          <input name="address" value={form.address} readOnly style={{ ...styles.input, flex:1 }}/>
          <button type="button" onClick={()=>setShowPicker(true)} style={styles.pinBtn}>📍</button>
        </div>
        <label style={styles.label}>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input}/>
        <label style={styles.label}>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} style={styles.input}/>
        <label style={styles.label}>Profile Picture</label>
        <input type="file" accept="image/*" onChange={handlePhoto} style={styles.file}/>
        {preview && <img src={preview} alt="preview" style={styles.preview}/>}
        <div style={{ textAlign:'right', marginTop:24 }}>
          <button onClick={()=>setShowForm(false)} style={styles.cancel}>Cancel</button>
          <button onClick={save} style={styles.save}>Save</button>
        </div>
      </Modal>

      {/* ---------- address picker modal ---------- */}
      <AddressPicker isOpen={showPicker} onClose={()=>setShowPicker(false)} onSelect={handleLocSelect} />
    </Layout>
  );
}

/* ---------- styles ---------- */
/* ---------- styles ---------- */
const modalStyles = {
  backdrop:{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000 },
  box:{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)', background:'#fff', padding:28, borderRadius:10, width:460, maxHeight:'80vh', overflowY:'auto', zIndex:1001 },
};

const styles = {
  cardWrapper:{ display:'flex', alignItems:'center', gap:20, marginBottom:'2em' },
  leftCol:{ display:'flex', flexDirection:'column', gap:12, alignItems:'center' },
  avatar:{ width:150, height:188, objectFit:'cover', borderRadius:8, border:'3px solid #eee', flexShrink:0 },
  table:{ width:'100%', maxWidth:600, borderCollapse:'collapse', background:'#fff', border:'1px solid #ddd', borderRadius:8 },
  th:{ background:'#f7f7f7', fontWeight:600, width:180, padding:12, textAlign:'left', borderBottom:'1px solid #eee' },
  td:{ padding:12, borderBottom:'1px solid #eee' },
  newBtn:{ background:'#4b77d1', color:'#fff', border:'none', padding:'10px 16px', fontSize:16, borderRadius:6, cursor:'pointer', marginBottom:24 },
  h2:{ marginBottom:12 },
  label:{ display:'block', fontWeight:600, margin:'16px 0 6px' },
  input:{ width:'100%', padding:10, fontSize:16, border:'1px solid #ccc'}
}

