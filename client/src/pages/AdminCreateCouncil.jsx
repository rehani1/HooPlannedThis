// ── src/pages/AdminCreateCouncil.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AddAdvisor from '../components/AddAdvisor';
import api from '../api'; 

/* ---------- centred modal wrapper ---------- */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <>
      <div style={modalBackdrop} onClick={onClose} />
      <div style={modalBox} onClick={e => e.stopPropagation()}>{children}</div>
    </>
  );
}

export default function AdminCreateCouncil() {
  // const [advisors, setAdvisors] = useState([
  //   { id: 1, name: 'Alice Smith' },
  //   { id: 2, name: 'Carmen Nguyen' },
    const [advisors, setAdvisors] = useState([]);

  const [councils, setCouncils] = useState({
    first:    [],
    second:   [],
    third:    [],
    trustees: [],
  });

  const [showCouncilForm, setShowCouncilForm] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);

  const [form, setForm] = useState({
    councilType: '',
    gradYear:    '',
    yearFrom:    '',
    yearTo:      '',
    committees:  [''],
    advisorId:   '',
  });

    // ─── load advisors on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/advisors');
        // assume data is [{ id, firstName, lastName, … }, …]
       setAdvisors(
          data.map(a => ({
            id:   a.id,
            name: `${a.firstName} ${a.lastName}`
          }))
        );
      } catch (err) {
        console.error('Failed to load advisors:', err);
      }
    })();
  }, []);

  // on-mount: load from server
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/councils');
        const buckets = { first: [], second: [], third: [], trustees: [] };
        data.forEach(row => {
          const {
            grad_year,
            academic_year,
            class_name,
            advisor_id,
            committees,
          } = row;
          // const advisorName =
          //   advisors.find(a => a.id === advisor_id)?.name || '';
          const advisorName = advisors.find(a => a.id === advisor_id)?.name || '';
          buckets[class_name]?.push({
            id:          `${class_name}-${grad_year}`,
            gradYear:    grad_year,
            acadYear:    academic_year,
            committees,                  // <-- pull in your array!
            advisorName,
          });
        });
        setCouncils(buckets);
      } catch (err) {
        console.error('Failed to load councils:', err);
      }
    })();
  }, [advisors]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCommitteeChange = (i, val) =>
    setForm(f => ({
      ...f,
      committees: f.committees.map((c, idx) =>
        idx === i ? val : c
      ),
    }));

  const addCommittee = () =>
    setForm(f => ({ ...f, committees: [...f.committees, ''] }));
  const removeCommittee = i =>
    setForm(f => ({
      ...f,
      committees: f.committees.filter((_, idx) => idx !== i),
    }));

  const saveCouncil = async () => {
    const payload = {
      gradYear:      Number(form.gradYear),
      academicYear:  `${form.yearFrom}-${form.yearTo}`.replace('–', '-'),
      className:     form.councilType,        // “first”/“second”/…
      advisorId:     Number(form.advisorId) || null,
      committees:    form.committees.filter(Boolean),
    };

    try {
      await api.post('/api/councils', payload);

      // append to our UI state
      const advisorName =
        advisors.find(a => a.id === payload.advisorId)?.name || '';
      setCouncils(c => ({
        ...c,
        [form.councilType]: [
          ...c[form.councilType],
          {
            id:          Date.now(),
            gradYear:    payload.gradYear,
            acadYear:    payload.academicYear,
            committees:  payload.committees,
            advisorName,
          },
        ],
      }));

      setForm({
        councilType: '',
        gradYear:    '',
        yearFrom:    '',
        yearTo:      '',
        committees:  [''],
        advisorId:   '',
      });
      setShowCouncilForm(false);
    } catch (err) {
      console.error('Failed to save council:', err);
      alert('There was an error saving this council');
    }
  };

  const saveNewAdvisor = a => {
    const name = `${a.firstName} ${a.lastName}`;
    setAdvisors(prev => [...prev, { id: a.id, name }]);
    setForm(f => ({ ...f, advisorId: a.id }));
    setShowAdvisorModal(false);
  };

  const renderCouncilTable = (label, arr) => (
    <>
      <h2 style={s.tableTitle}>{label}</h2>
      {arr.length ? (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Grad Year</th>
              <th style={s.th}>Academic Year</th>
              <th style={s.th}>Committees</th>
              <th style={s.th}>Advisor</th>
            </tr>
          </thead>
          <tbody>
            {arr.map(c => (
              <tr key={c.id}>
                <td style={s.td}>{c.gradYear}</td>
                <td style={s.td}>{c.acadYear}</td>
                <td style={s.td}>
                  {c.committees.map((n, i) => (
                    <div key={i}>{n}</div>
                  ))}
                </td>
                <td style={s.td}>{c.advisorName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No councils yet.</p>
      )}
    </>
  );

  return (
    <Layout>
      <h1 style={s.h1}>Admin Create Council Page</h1>

      <div style={{ textAlign:'center', marginBottom:32 }}>
        <button style={s.createBtn} onClick={()=>setShowCouncilForm(true)}>
          + Create New Council
        </button>
      </div>

      {renderCouncilTable('First-Year Council',   councils.first)}
      {renderCouncilTable('Second-Year Council',  councils.second)}
      {renderCouncilTable('Third-Year Council',   councils.third)}
      {renderCouncilTable('Trustees',             councils.trustees)}

      <div style={{ marginTop: 48, textAlign: 'center' }}>
        <h2 style={{ ...s.tableTitle, marginBottom: 16 }}>Admin Add Advisor</h2>
        {/* <button
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#4b77d1',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16
          }}
          onClick={() => setShowAdvisorModal(true)}
        >
          + Add New Advisor
        </button> */}
      </div>

      <Modal open={showCouncilForm} onClose={()=>setShowCouncilForm(false)}>
        <h2>New Council</h2>

        <label style={s.label}>Council</label>
        <select name="councilType" value={form.councilType} onChange={handleChange} style={s.select}>
          <option value="" disabled>Choose…</option>
          <option value="first">First-Year</option>
          <option value="second">Second-Year</option>
          <option value="third">Third-Year</option>
          <option value="trustees">Trustees</option>
        </select>

        <label style={s.label}>Graduation Year</label>
        <input name="gradYear" type="number" value={form.gradYear} onChange={handleChange} style={s.gradYearInput}/>

        <label style={s.label}>Academic Year</label>
        <div style={s.yearRow}>
          <input name="yearFrom" type="number" value={form.yearFrom} onChange={handleChange} style={s.yearInput}/>
          <span style={s.dash}>-</span>
          <input name="yearTo"   type="number" value={form.yearTo}   onChange={handleChange} style={s.yearInput}/>
        </div>

        <label style={s.label}>Committees</label>
        {form.committees.map((c,i)=>(
          <div key={i} style={s.commRow}>
            <input
              value={c}
              onChange={e=>handleCommitteeChange(i,e.target.value)}
              style={s.commInput}
            />
            {form.committees.length>1 && (
              <button onClick={()=>removeCommittee(i)} style={s.delBtn}>✕</button>
            )}
          </div>
        ))}
        <button onClick={addCommittee} style={s.addBtn}>＋ Add Committee</button>

        <label style={s.label}>Assign Advisor</label>
        <select
          name="advisorId"
          value={form.advisorId}
          onChange={e=>{
            if (e.target.value==='new') setShowAdvisorModal(true);
            else                       handleChange(e);
          }}
          style={s.select}
        >
          <option value="" disabled>Select advisor…</option>
          {advisors.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
          {/* <option value="new">＋ Add New Advisor</option> */}
        </select>
        

        <div style={{ textAlign:'right', marginTop:28 }}>
          <button onClick={()=>setShowCouncilForm(false)} style={s.cancel}>Cancel</button>
          <button onClick={saveCouncil} style={s.save}>Save</button>
        </div>
      </Modal>

      <AddAdvisor
        isOpen={showAdvisorModal}
        onClose={()=>setShowAdvisorModal(false)}
        onSave={saveNewAdvisor}
      />
    </Layout>
  );
}

// … (styles omitted for brevity)

/* ---------- styles ---------- */
const s = {
  h1:{ textAlign:'center', margin:'24px 0 8px', fontSize:40, fontWeight:700 },
  createBtn:{ background:'#a45614', color:'#fff', border:'none', padding:'12px 24px', fontSize:18, cursor:'pointer', borderRadius:6 },
  tableTitle:{ marginTop:32, marginBottom:8 },
  table:{ width:'100%', borderCollapse:'collapse', background:'#fff', border:'1px solid #ddd', borderRadius:8 },
  th:{ background:'#f7f7f7', fontWeight:600, padding:10, border:'1px solid #ddd' },
  td:{ padding:10, border:'1px solid #ddd', },
  label:{ display:'block', fontWeight:600, margin:'18px 0 6px' , textAlign:'left' },
  select:{ width:'100%', padding:10, fontSize:16, border:'1px solid #ccc', borderRadius:6 },
  gradYearInput:{ display:'block', width:'100%', maxWidth:120, padding:8, fontSize:16, border:'1px solid #ccc', borderRadius:6 },
  yearRow:{ display:'flex', alignItems:'center', gap:8 },
  yearInput:{ width:90, padding:8, fontSize:16, border:'1px solid #ccc', borderRadius:6 },
  dash:{ fontWeight:700 },
  commRow:{ display:'flex', alignItems:'center', gap:6, marginBottom:8 },
  commInput:{ flex:1, padding:8, fontSize:16, border:'1px solid #ccc', borderRadius:6 },
  delBtn:{ background:'#e43f3f', color:'#fff', border:'none', cursor:'pointer', padding:'6px 10px', borderRadius:4 },
  addBtn:{ background:'#4b77d1', color:'#fff', border:'none', cursor:'pointer', padding:'8px 14px', borderRadius:6, fontSize:14 },
  cancel:{ marginRight:14, padding:'10px 22px', border:'1px solid #888', background:'#fff', cursor:'pointer', borderRadius:6 },
  save:{ padding:'10px 24px', border:'none', background:'#ff8937', color:'#fff', cursor:'pointer', borderRadius:6 },
};

/* modal skins */
const modalBackdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000 };
const modalBox = { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                   background:'#fff', padding:28, borderRadius:10, width:460,
                   maxHeight:'80vh', overflowY:'auto', zIndex:1001 };


