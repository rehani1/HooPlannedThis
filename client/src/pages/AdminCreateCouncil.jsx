// ── src/pages/AdminCreateCouncil.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';

/* ───────────── tiny centred‑modal ───────────── */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div style={modal.backdrop} onClick={onClose} />
      <div style={modal.box} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </>
  );
}

/* ───────────── page ───────────── */
export default function AdminCreateCouncil() {
  const [show, setShow] = useState(false);

  /* pretend these came from your DB */
  const existingAdvisors = [
    { id: 1, name: 'Alice Smith'   },
    { id: 2, name: 'Carmen Nguyen' }
  ];

  const [form, setForm] = useState({
    councilType : '',
    gradYear    : '',
    yearFrom    : '',
    yearTo      : '',
    committees  : [''],
    advisorId   : '',        /* id OR 'new' */
    newAdvisor  : {          /* only used if advisorId === 'new' */
      firstName:'', lastName:'', buildingName:'', buildingAddress: '', email:'', phone:''
    }
  });

  /* helpers -------------------------------------------------- */
  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCommitteeChange = (i, v) =>
    setForm(p => ({
      ...p, committees: p.committees.map((c,idx)=> idx===i ? v : c)
    }));

  const addCommittee    = ()  => setForm(p => ({ ...p, committees:[...p.committees,''] }));
  const removeCommittee = i   => setForm(p => ({ ...p,
                                   committees:p.committees.filter((_,idx)=>idx!==i) }));

  const handleNewAdvisor = e =>
    setForm(p => ({
      ...p,
      newAdvisor:{ ...p.newAdvisor, [e.target.name]: e.target.value }
    }));

  const save = () => {
    /* you will likely POST this object: */
    console.log('payload', form);
    setShow(false);
  };

  /* ---------------------------------------------------------- */
  return (
    <Layout>
      <h1 style={s.h1}>Admin Create Council Page</h1>
      <p style={{ textAlign:'center', marginBottom:32 }}>
        This is where your Admin Page will be.
      </p>

      <div style={{ textAlign:'center' }}>
        <button style={s.createBtn} onClick={()=>setShow(true)}>
          + Create New Council
        </button>
      </div>

      {/* ───────── modal ───────── */}
      <Modal open={show} onClose={()=>setShow(false)}>
        <h2 style={{ marginTop:0 }}>New Council</h2>

        {/* 1️⃣ council type */}
        <label style={s.label}>Council Type</label>
        <select name="councilType" value={form.councilType}
                onChange={handleChange} style={s.select}>
          <option value="" disabled>Choose…</option>
          <option value="first">First‑Year Council</option>
          <option value="second">Second‑Year Council</option>
          <option value="third">Third‑Year Council</option>
          <option value="trustees">Trustees</option>
        </select>

        {/* 2️⃣ graduation year */}
        <label style={s.label}>Council Graduation Year</label>
        <input name="gradYear" type="number" placeholder="2028"
               value={form.gradYear} onChange={handleChange}
               style={s.gradYearInput} />

        {/* 3️⃣ academic year */}
        <label style={s.label}>Academic Year</label>
        <div style={s.yearRow}>
          <input name="yearFrom" type="number" placeholder="2025"
                 value={form.yearFrom} onChange={handleChange}
                 style={s.yearInput}/>
          <span style={s.dash}> – </span>
          <input name="yearTo" type="number" placeholder="2026"
                 value={form.yearTo} onChange={handleChange}
                 style={s.yearInput}/>
        </div>

        {/* 4️⃣ committees */}
        <label style={s.label}>Committees (people can join)</label>
        {form.committees.map((c,i)=>(
          <div key={i} style={s.commRow}>
            <input value={c} placeholder="e.g. Wellness Committee"
                   onChange={e=>handleCommitteeChange(i, e.target.value)}
                   style={s.commInput}/>
            {form.committees.length>1 && (
              <button onClick={()=>removeCommittee(i)} style={s.delBtn}>✕</button>
            )}
          </div>
        ))}
        <button style={s.addBtn} onClick={addCommittee}>＋ Add Committee</button>

        {/* 5️⃣ advisor assignment */}
        <label style={s.label}>Assign Advisor</label>
        <select name="advisorId" value={form.advisorId}
                onChange={handleChange} style={s.select}>
          <option value="" disabled>Select advisor…</option>
          {existingAdvisors.map(a=>(
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
          <option value="new">＋ Add New Advisor</option>
        </select>

        {/* new‑advisor inline form */}
        {form.advisorId==='new' && (
          <>
            <div style={s.newAdvGrid}>
              <input name="firstName" placeholder="First Name"
                     value={form.newAdvisor.firstName}
                     onChange={handleNewAdvisor} style={s.newInput}/>
              <input name="lastName" placeholder="Last Name"
                     value={form.newAdvisor.lastName}
                     onChange={handleNewAdvisor} style={s.newInput}/>
             <input name="buildingName" placeholder="Building Name"
                     value={form.newAdvisor.buildingName}
                     onChange={handleNewAdvisor} style={s.newInput}/>
              <input name="email" placeholder="Email"
                     value={form.newAdvisor.email}
                     onChange={handleNewAdvisor} style={s.newInput}/>
              <input name="phone" placeholder="Phone"
                     value={form.newAdvisor.phone}
                     onChange={handleNewAdvisor} style={s.newInput}/>
            </div>
          </>
        )}

        {/* footer */}
        <div style={{ textAlign:'right', marginTop:28 }}>
          <button onClick={()=>setShow(false)} style={s.cancel}>Cancel</button>
          <button onClick={save} style={s.save}>Save</button>
        </div>
      </Modal>
    </Layout>
  );
}

/* ───────── styles ───────── */
const s = {
  h1       : { textAlign:'center', margin:'24px 0 8px', fontSize:40, fontWeight:700 },
  createBtn: { background:'#a45614', color:'#fff', border:'none',
               padding:'12px 24px', fontSize:18, cursor:'pointer', borderRadius:6 },

  label   : { display:'block', fontWeight:600, margin:'18px 0 6px', textAlign:'left' },
  select  : { display:'block', width:'100%', padding:10, fontSize:16,
              border:'1px solid #ccc', borderRadius:6, background:'#fff' },

  gradYearInput:{ display:'block', width:'100%', maxWidth:120, padding:8,
                  fontSize:16, border:'1px solid #ccc', borderRadius:6 },

  yearRow : { display:'flex', alignItems:'center', gap:8 },
  yearInput:{ width:90, padding:8, fontSize:16,
              border:'1px solid #ccc', borderRadius:6 },
  dash    : { fontWeight:700 },

  /* committee list */
  commRow : { display:'flex', alignItems:'center', gap:6, marginBottom:8 },
  commInput:{ flex:1, padding:8, fontSize:16,
              border:'1px solid #ccc', borderRadius:6 },
  delBtn  : { background:'#e43f3f', color:'#fff', border:'none', cursor:'pointer',
              padding:'6px 10px', borderRadius:4, fontSize:14, lineHeight:1 },
  addBtn  : { background:'#4b77d1', color:'#fff', border:'none', cursor:'pointer',
              padding:'8px 14px', borderRadius:6, fontSize:14 },

  /* new‑advisor mini‑form */
  newAdvGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr',
               gap:8, marginTop:12 },
  newInput :{ width:'100%', padding:8, fontSize:16,
              border:'1px solid #ccc', borderRadius:6 },

  /* footer buttons */
  cancel  : { marginRight:14, padding:'10px 22px',
              border:'1px solid #888', background:'#fff',
              cursor:'pointer', borderRadius:6 },
  save    : { padding:'10px 24px', border:'none',
              background:'#ff8937', color:'#fff',
              cursor:'pointer', borderRadius:6 }
};

/* shared modal box / backdrop */
const modal = {
  backdrop:{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000 },
  box     :{ position:'fixed', top:'50%', left:'50%',
             transform:'translate(-50%, -50%)',
             background:'#fff', padding:28, borderRadius:10,
             width:460, maxHeight:'80vh', overflowY:'auto', zIndex:1001 }
};
