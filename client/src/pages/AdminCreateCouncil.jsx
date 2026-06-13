



// ── src/pages/AdminCreateCouncil.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AddAdvisor from '../components/AddAdvisor';
import { clearAdminSetupSession, getAdminSetupToken } from '../adminSetupAuth';
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

function emptyCouncilForm() {
  return {
    councilType: '',
    gradYear:    '',
    yearFrom:    '',
    yearTo:      '',
    budgetTotal: '',
    committees:  [{ id: null, name: '' }],
    advisorId:   '',
  };
}

export default function AdminCreateCouncil() {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [accountRequestError, setAccountRequestError] = useState('');
  const [accountRequestActionId, setAccountRequestActionId] = useState(null);
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);

  const [councils, setCouncils] = useState({
    first:    [],
    second:   [],
    third:    [],
    trustees: [],
  });

  const [showCouncilForm, setShowCouncilForm] = useState(false);
  const [editingCouncilId, setEditingCouncilId] = useState(null);

  const [form, setForm] = useState(emptyCouncilForm);

  const getAdminHeaders = useCallback(() => {
    const adminToken = getAdminSetupToken();
    if (!adminToken) {
      clearAdminSetupSession();
      navigate('/login', { replace: true });
      return null;
    }
    return { Authorization: `Bearer ${adminToken}` };
  }, [navigate]);

  const handleBackToLogin = () => {
    clearAdminSetupSession();
    navigate('/login', { replace: true });
  };

  const loadAdvisors = useCallback(async () => {
    try {
      const { data } = await api.get('/api/advisors');
      setAdvisors(
        data.map(advisor => ({
          ...advisor,
          name: `${advisor.firstName} ${advisor.lastName}`
        }))
      );
    } catch (err) {
      console.error('Failed to load advisors:', err);
    }
  }, []);

  const loadCouncils = useCallback(async () => {
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
        const advisorName = advisors.find(a => a.id === advisor_id)?.name || '';
        buckets[class_name]?.push({
          id:          row.council_year_id,
          className:   class_name,
          advisorId:   advisor_id,
          gradYear:    grad_year,
          acadYear:    academic_year,
          budgetTotal: row.budget_total,
          committees,
          committeeRecords: row.committeeRecords || committees.map(name => ({ id: null, name })),
          advisorName,
        });
      });
      setCouncils(buckets);
    } catch (err) {
      console.error('Failed to load councils:', err);
    }
  }, [advisors]);

  const loadAccountRequests = useCallback(async () => {
    const headers = getAdminHeaders();
    if (!headers) return;

    try {
      const { data } = await api.get('/api/account-requests', { headers });
      setAccountRequests(data);
      setAccountRequestError('');
    } catch (err) {
      setAccountRequestError(err.response?.data?.message || 'Failed to load account requests');
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearAdminSetupSession();
        navigate('/login', { replace: true });
      }
    }
  }, [getAdminHeaders, navigate]);

    
  useEffect(() => {
    loadAdvisors();
  }, [loadAdvisors]);

  useEffect(() => {
    loadAccountRequests();
  }, [loadAccountRequests]);

  
  useEffect(() => {
    loadCouncils();
  }, [loadCouncils]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCommitteeChange = (i, val) =>
    setForm(f => ({
      ...f,
      committees: f.committees.map((committee, idx) =>
        idx === i ? { ...committee, name: val } : committee
      ),
    }));

  const addCommittee = () =>
    setForm(f => ({ ...f, committees: [...f.committees, { id: null, name: '' }] }));
  const removeCommittee = i =>
    setForm(f => ({
      ...f,
      committees: f.committees.filter((_, idx) => idx !== i),
    }));

  const openCreateCouncilForm = () => {
    setEditingCouncilId(null);
    setForm(emptyCouncilForm());
    setShowCouncilForm(true);
  };

  const openEditCouncilForm = council => {
    const [yearFrom = '', yearTo = ''] = String(council.acadYear || '').split('-');
    setEditingCouncilId(council.id);
    setForm({
      councilType: council.className || '',
      gradYear:    String(council.gradYear || ''),
      yearFrom,
      yearTo,
      budgetTotal: String(council.budgetTotal ?? ''),
      committees:  council.committeeRecords?.length ? council.committeeRecords : [{ id: null, name: '' }],
      advisorId:   council.advisorId ? String(council.advisorId) : '',
    });
    setShowCouncilForm(true);
  };

  const closeCouncilForm = () => {
    setShowCouncilForm(false);
    setEditingCouncilId(null);
    setForm(emptyCouncilForm());
  };

  const saveCouncil = async () => {
    const headers = getAdminHeaders();
    if (!headers) return;

    const payload = {
      gradYear:      Number(form.gradYear),
      academicYear:  `${form.yearFrom}-${form.yearTo}`.replace('–', '-'),
      className:     form.councilType,        // “first”/“second”/…
      advisorId:     Number(form.advisorId) || null,
      budgetTotal:    Number(form.budgetTotal) || 0,
      committees:    form.committees
        .map(committee => ({
          id: committee.id || null,
          name: committee.name.trim(),
        }))
        .filter(committee => committee.name),
    };

    try {
      if (editingCouncilId) {
        await api.put(`/api/councils/${editingCouncilId}`, payload, { headers });
      } else {
        await api.post('/api/councils', payload, { headers });
      }

      await loadCouncils();
      closeCouncilForm();
    } catch (err) {
      console.error('Failed to save council:', err);
      alert(err.response?.data?.message || 'There was an error saving this council');
    }
  };

  const saveAdvisor = advisor => {
    const nextAdvisor = {
      ...advisor,
      name: `${advisor.firstName} ${advisor.lastName}`
    };
    setAdvisors(prev =>
      prev.some(existingAdvisor => existingAdvisor.id === nextAdvisor.id)
        ? prev.map(existingAdvisor => existingAdvisor.id === nextAdvisor.id ? nextAdvisor : existingAdvisor)
        : [...prev, nextAdvisor]
    );
    setForm(f => ({ ...f, advisorId: nextAdvisor.id }));
  };

  const reviewAccountRequest = async (id, decision) => {
    const headers = getAdminHeaders();
    if (!headers) return;

    setAccountRequestActionId(id);
    setAccountRequestError('');

    try {
      await api.post(`/api/account-requests/${id}/${decision}`, null, { headers });
      setAccountRequests(requests => requests.filter(request => request.id !== id));
    } catch (err) {
      setAccountRequestError(err.response?.data?.message || `Failed to ${decision} account request`);
    } finally {
      setAccountRequestActionId(null);
    }
  };

  const handleMasterReset = async () => {
    const headers = getAdminHeaders();
    if (!headers) return;

    const confirmed = window.prompt('This deletes all councils, members, account requests, events, budgets, advisors, supplies, vendors, locations, documents, advertisements, and volunteer data. Type RESET to continue.');
    if (confirmed !== 'RESET') return;

    setIsResetting(true);
    setResetError('');

    try {
      await api.post('/api/admin/master-reset', { confirmation: 'RESET' }, { headers });
      setAccountRequests([]);
      setCouncils({ first: [], second: [], third: [], trustees: [] });
      setAdvisors([]);
      closeCouncilForm();
      setResetVersion(version => version + 1);
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset application data');
    } finally {
      setIsResetting(false);
    }
  };

  const renderAccountRequests = () => (
    <section style={s.panel}>
      <div style={s.panelHeader}>
        <h2 style={s.panelTitle}>Class Account Requests</h2>
      </div>
      {accountRequestError && <p style={s.errorText}>{accountRequestError}</p>}
      {accountRequests.length ? (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Computing ID</th>
                <th style={s.th}>Class</th>
                <th style={s.th}>Academic Year</th>
                <th style={s.th}>Role</th>
                <th style={s.th}>Committee</th>
                <th style={s.th}>Email</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {accountRequests.map(request => (
                <tr key={request.id}>
                  <td style={s.td}>{request.firstName} {request.lastName}</td>
                  <td style={s.td}>{request.username}</td>
                  <td style={s.td}>{request.classId}</td>
                  <td style={s.td}>{request.academicYear}</td>
                  <td style={s.td}>{request.role || '-'}</td>
                  <td style={s.td}>{request.committee || '-'}</td>
                  <td style={s.td}>{request.email}</td>
                  <td style={s.td}>
                    <div style={s.actionRow}>
                      <button
                        type="button"
                        onClick={() => reviewAccountRequest(request.id, 'approve')}
                        style={s.approveBtn}
                        disabled={accountRequestActionId === request.id}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewAccountRequest(request.id, 'deny')}
                        style={s.denyBtn}
                        disabled={accountRequestActionId === request.id}
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={s.emptyText}>No pending account requests.</p>
      )}
    </section>
  );

  const renderCouncilTable = (label, arr) => (
    <div style={s.councilBlock}>
      <h3 style={s.tableTitle}>{label}</h3>
      {arr.length ? (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Grad Year</th>
                <th style={s.th}>Academic Year</th>
                <th style={s.th}>Budget</th>
                <th style={s.th}>Committees</th>
                <th style={s.th}>Advisor</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {arr.map(c => (
                <tr key={c.id}>
                  <td style={s.td}>{c.gradYear}</td>
                  <td style={s.td}>{c.acadYear}</td>
                  <td style={s.td}>${Number(c.budgetTotal || 0).toLocaleString()}</td>
                  <td style={s.td}>
                    {c.committees.map((n, i) => (
                      <div key={i}>{n}</div>
                    ))}
                  </td>
                  <td style={s.td}>{c.advisorName || '-'}</td>
                  <td style={s.td}>
                    <button type="button" onClick={() => openEditCouncilForm(c)} style={s.editBtn}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={s.emptyText}>No councils yet.</p>
      )}
    </div>
  );

  return (
    <main style={s.page}>
      <section style={s.content}>
        <button type="button" onClick={handleBackToLogin} style={s.backBtn}>
          <ArrowLeft size={18} strokeWidth={2.2} />
          Back to Login
        </button>

        <h1 style={s.h1}>Configure Class Councils</h1>

        {renderAccountRequests()}

        <section style={s.panel}>
          <div style={s.panelHeader}>
            <h2 style={s.panelTitle}>Class Councils</h2>
            <button type="button" style={s.createBtn} onClick={openCreateCouncilForm}>
              + Create Council
            </button>
          </div>

          {renderCouncilTable('First-Year Council',   councils.first)}
          {renderCouncilTable('Second-Year Council',  councils.second)}
          {renderCouncilTable('Third-Year Council',   councils.third)}
          {renderCouncilTable('Trustees',             councils.trustees)}
        </section>

        <section style={s.panel}>
          <AddAdvisor
            key={resetVersion}
            authToken={getAdminSetupToken()}
            onAdvisorCreated={saveAdvisor}
            onAdvisorUpdated={saveAdvisor}
          />
        </section>

        <section style={s.dangerZone}>
          <div>
            <h2 style={s.dangerTitle}>Master Reset</h2>
            <p style={s.dangerText}>
              Deletes all councils, members, account requests, events, budgets, advisors, supplies, vendors, locations, documents, advertisements, and volunteer data.
            </p>
            {resetError && <p style={s.errorText}>{resetError}</p>}
          </div>
          <button
            type="button"
            onClick={handleMasterReset}
            style={s.resetBtn}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Master Reset'}
          </button>
        </section>

        <Modal open={showCouncilForm} onClose={closeCouncilForm}>
          <h2 style={s.modalTitle}>{editingCouncilId ? 'Edit Council' : 'New Council'}</h2>

          <label style={s.label}>Council</label>
          <select name="councilType" value={form.councilType} onChange={handleChange} style={s.select}>
            <option value="" disabled>Choose...</option>
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

          <label style={s.label}>Budget Total</label>
          <input
            name="budgetTotal"
            type="number"
            min="0"
            step="0.01"
            value={form.budgetTotal}
            onChange={handleChange}
            style={s.select}
          />

          <label style={s.label}>Committees</label>
          {form.committees.map((committee,i)=>(
            <div key={committee.id || `new-${i}`} style={s.commRow}>
              <input
                value={committee.name}
                onChange={e=>handleCommitteeChange(i,e.target.value)}
                style={s.commInput}
              />
              {form.committees.length>1 && (
                <button onClick={()=>removeCommittee(i)} style={s.delBtn}>x</button>
              )}
            </div>
          ))}
          <button onClick={addCommittee} style={s.addBtn}>+ Add Committee</button>

          <label style={s.label}>Assign Advisor</label>
          <select
            name="advisorId"
            value={form.advisorId}
            onChange={handleChange}
            style={s.select}
          >
            <option value="" disabled>Select advisor...</option>
            {advisors.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <div style={{ textAlign:'right', marginTop:28 }}>
            <button type="button" onClick={closeCouncilForm} style={s.cancel}>Cancel</button>
            <button type="button" onClick={saveCouncil} style={s.save}>
              {editingCouncilId ? 'Update' : 'Save'}
            </button>
          </div>
        </Modal>
      </section>
    </main>
  );
}


const s = {
  page:{ minHeight:'100vh', background:'#f3f5f7', padding:'32px 24px', boxSizing:'border-box', fontFamily:'Montserrat, sans-serif' },
  content:{ maxWidth:1100, margin:'0 auto' },
  backBtn:{ display:'inline-flex', alignItems:'center', gap:8, background:'#fff', color:'#003e83', border:'1px solid #d7dce2', padding:'10px 16px', fontSize:15, fontWeight:600, cursor:'pointer', borderRadius:6 },
  h1:{ textAlign:'center', margin:'24px 0 28px', fontSize:40, fontWeight:700, color:'#003e83' },
  panel:{ background:'#fff', border:'1px solid #dfe4ea', borderRadius:8, padding:20, marginBottom:24, boxShadow:'0 1px 3px rgba(16, 24, 40, 0.06)' },
  panelHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:18 },
  panelTitle:{ margin:0, color:'#003e83', fontSize:24, fontWeight:700 },
  dangerZone:{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, background:'#fff5f5', border:'1px solid #f2b8b5', borderRadius:8, padding:'18px 20px', margin:'0 0 24px' },
  dangerTitle:{ color:'#8f1d18', fontSize:22, fontWeight:700, margin:'0 0 8px' },
  dangerText:{ color:'#5c1f1b', margin:0, lineHeight:1.45 },
  resetBtn:{ flex:'0 0 auto', background:'#b42318', color:'#fff', border:'none', cursor:'pointer', padding:'12px 18px', borderRadius:6, fontSize:16, fontWeight:700 },
  createBtn:{ background:'#003e83', color:'#fff', border:'none', padding:'10px 18px', fontSize:15, fontWeight:700, cursor:'pointer', borderRadius:6 },
  councilBlock:{ marginTop:20 },
  tableTitle:{ margin:'0 0 10px', color:'#1b365d', fontSize:18, fontWeight:700 },
  tableWrap:{ overflowX:'auto' },
  table:{ width:'100%', borderCollapse:'collapse', background:'#fff', border:'1px solid #ddd', borderRadius:8 },
  th:{ background:'#f7f7f7', fontWeight:600, padding:10, border:'1px solid #ddd', textAlign:'left' },
  td:{ padding:10, border:'1px solid #ddd', },
  modalTitle:{ margin:'0 0 18px', color:'#003e83', fontSize:26, fontWeight:700 },
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
  actionRow:{ display:'flex', gap:8, justifyContent:'center' },
  approveBtn:{ background:'#1f7a4d', color:'#fff', border:'none', cursor:'pointer', padding:'8px 12px', borderRadius:6, fontSize:14 },
  denyBtn:{ background:'#b42318', color:'#fff', border:'none', cursor:'pointer', padding:'8px 12px', borderRadius:6, fontSize:14 },
  errorText:{ color:'#b42318', fontWeight:600 },
  emptyText:{ margin:0, color:'#4d5b6a' },
  editBtn:{ background:'#fff', color:'#003e83', border:'1px solid #d7dce2', cursor:'pointer', padding:'7px 12px', borderRadius:6, fontSize:14, fontWeight:600 },
  cancel:{ marginRight:14, padding:'10px 22px', border:'1px solid #888', background:'#fff', cursor:'pointer', borderRadius:6 },
  save:{ padding:'10px 24px', border:'none', background:'#ff8937', color:'#fff', cursor:'pointer', borderRadius:6 },
};


const modalBackdrop = { position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000 };
const modalBox = { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
                   background:'#fff', padding:28, borderRadius:10, width:'min(460px, calc(100vw - 32px))',
                   boxSizing:'border-box',
                   maxHeight:'80vh', overflowY:'auto', zIndex:1001 };
