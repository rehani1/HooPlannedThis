import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function blankSupply() {
  return {
    name: '',
    quantity: '',
    unitCost: '',
    notes: '',
    link: '',
    reusable: false,
    return_needed: false,
    vendor: {
      company: '',
      contact_name: '',
      contact_address: '',
      contact_email: '',
      contact_phone: ''
    }
  };
}

const badge = {
  display: 'inline-block',
  marginRight: '6px',
  padding: '2px 6px',
  fontSize: '0.75rem',
  background: '#f0f0f0',
  borderRadius: '3px',
  color: '#333'
};

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [supplies, setSupplies] = useState({});
  const [showForm, setShowForm] = useState({});
  const [supplyForm, setSupplyForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => {
        setEvents(data);
        data.forEach(evt => fetchSupplies(evt.id || evt.event_id));
      })
      .catch(e => setError(e.toString()))
      .finally(() => setLoading(false));
  }, []);

  const fetchSupplies = eventId => {
    fetch(`${API_BASE}/api/events/${eventId}/supplies`)
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => setSupplies(prev => ({ ...prev, [eventId]: data || [] })))
      .catch(() => setSupplies(prev => ({ ...prev, [eventId]: [] })));
  };

  const handleShowForm = eventId => {
    setShowForm(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    setSupplyForm(prev => ({ ...prev, [eventId]: blankSupply() }));
  };

  const handleFormChange = (eventId, e, isVendor = false) => {
    const { name, value, type, checked } = e.target;
    setSupplyForm(prev => ({
      ...prev,
      [eventId]: isVendor
        ? { ...prev[eventId], vendor: { ...prev[eventId].vendor, [name]: value } }
        : { ...prev[eventId], [name]: type === 'checkbox' ? checked : value }
    }));
  };

  const handleAddSupply = async eventId => {
    const form = supplyForm[eventId];
    const payload = {
      name: form.name,
      quantity: parseInt(form.quantity, 10) || 0,
      unitCost: parseFloat(form.unitCost) || 0,
      notes: form.notes || null,
      link: form.link || null,
      reusable: form.reusable,
      return_needed: form.return_needed,
      vendor: {
        company: form.vendor.company,
        contact_name: form.vendor.contact_name || null,
        contact_address: form.vendor.contact_address || null,
        contact_email: form.vendor.contact_email || null,
        contact_phone: form.vendor.contact_phone || null
      }
    };

    await fetch(`${API_BASE}/api/events/${eventId}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchSupplies(eventId);
    setShowForm(prev => ({ ...prev, [eventId]: false }));
  };

  if (loading) return <Layout><p>Loading…</p></Layout>;
  if (error)   return <Layout><p style={{ color: 'crimson' }}>Error: {error}</p></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: '40px auto' }}>
        <h1>Manage Events & Supplies</h1>
        <div style={{ display: 'grid', gap: 24 }}>
          {events.map(evt => {
            const eventId = evt.id || evt.event_id;
            const form    = supplyForm[eventId] || blankSupply();
            const list    = supplies[eventId] || [];

            return (
              <div key={eventId} style={{ padding:24, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', background:'white' }}>
                <h2 style={{ marginBottom:6 }}>{evt.name || evt.title || `Event #${eventId}`}</h2>
                {Object.entries(evt).map(([k,v]) => (
                  <p key={k} style={{ margin:'2px 0', fontSize:'0.92rem' }}>
                    <strong>{k.replace(/_/g,' ')}:</strong> {v == null ? '—' : String(v)}
                  </p>
                ))}

                <h3 style={{ marginTop:12, marginBottom:4 }}>Supplies</h3>
                <ul style={{ listStyle:'none', padding:0 }}>
                  {list.length === 0 && (<li style={{ color:'#aaa' }}>No supplies</li>)}
                  {list.map((s,i) => {
                    const unitPrice = parseFloat(s.cost) || 0;
                    const qty       = Number(s.stock_qty ?? s.quantity) || 0;
                    const total     = (unitPrice * qty).toFixed(2);

                    return (
                      <li key={i} style={{ marginBottom:16 }}>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div>
                            <strong>{s.name}</strong>{' '}
                            <span style={{ color:'#666' }}>Qty: {qty}</span>

                            <div style={{ fontSize:'0.9rem', marginTop:4 }}>
                              {/* <span>Unit: ${unitPrice.toFixed(2)}</span>{' • '} */}
                              <span>Total: ${total}</span>
                            </div>

                            <div style={{ marginTop:4, fontSize:'0.9rem' }}>
                              {s.reusable && <span style={badge}>Reusable</span>}
                              {s.return_needed && <span style={badge}>Return Needed</span>}
                              {s.link && (
                                <a href={s.link} target="_blank" rel="noopener noreferrer"
                                   style={{ marginLeft:8, color:'#007bff', textDecoration:'underline' }}>
                                  Link
                                </a>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign:'right', fontSize:'0.9rem', color:'#333' }}>
                            Vendor:<br/>
                            <strong>{s.vendor?.company || '—'}</strong>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={() => handleShowForm(eventId)}
                  style={{ marginTop:10, background:'#ff8937', color:'#fff', padding:'7px 15px', border:'none', borderRadius:4, cursor:'pointer' }}
                >
                  {showForm[eventId] ? 'Cancel' : '+ Add Supply'}
                </button>

                {showForm[eventId] && (
                  <div style={{ border:'1px solid #eee', marginTop:15, borderRadius:6, padding:12, background:'#faf8f4' }}>
                    <h4>Add Supply</h4>
                    <input placeholder="Item Name" name="name" value={form.name}
                      onChange={e => handleFormChange(eventId, e)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Quantity" name="quantity" type="number" value={form.quantity}
                      onChange={e => handleFormChange(eventId, e)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Unit Cost" name="unitCost" type="number" step="0.01"
                      value={form.unitCost} onChange={e => handleFormChange(eventId, e)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <textarea placeholder="Notes" name="notes" rows={2} value={form.notes}
                      onChange={e => handleFormChange(eventId, e)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Link" name="link" value={form.link}
                      onChange={e => handleFormChange(eventId, e)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <label><input type="checkbox" name="reusable" checked={form.reusable}
                      onChange={e => handleFormChange(eventId, e)} /> Reusable</label>
                    <label style={{ marginLeft:14 }}><input type="checkbox" name="return_needed"
                      checked={form.return_needed} onChange={e => handleFormChange(eventId, e)} /> Return needed</label>

                    <h5 style={{ marginTop:12 }}>Vendor Info</h5>
                    <input placeholder="Company" name="company" value={form.vendor.company}
                      onChange={e => handleFormChange(eventId, e, true)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Contact Name" name="contact_name" value={form.vendor.contact_name}
                      onChange={e => handleFormChange(eventId, e, true)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Contact Address" name="contact_address"
                      value={form.vendor.contact_address}
                      onChange={e => handleFormChange(eventId, e, true)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Contact Email" name="contact_email" type="email"
                      value={form.vendor.contact_email}
                      onChange={e => handleFormChange(eventId, e, true)}
                      style={{ width:'100%', marginBottom:6 }} />
                    <input placeholder="Contact Phone" name="contact_phone" type="tel"
                      value={form.vendor.contact_phone}
                      onChange={e => handleFormChange(eventId, e, true)}
                      style={{ width:'100%', marginBottom:6 }} />

                    <button
                      onClick={() => handleAddSupply(eventId)}
                      style={{ marginTop:12, background:'#28a745', color:'#fff', padding:'8px 16px', border:'none', borderRadius:4, cursor:'pointer' }}
                    >Add Supply</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}


// import React, { useState, useEffect } from 'react';
// import Layout from '../components/Layout';

// const API_BASE = import.meta.env.VITE_API_URL || '';

// function blankSupply() {
//   return {
//     name: '',
//     quantity: '',
//     unitCost: '',
//     notes: '',
//     link: '',
//     reusable: false,
//     return_needed: false,
//     vendor: {
//       company: '',
//       contact_name: '',
//       contact_address: '',
//       contact_email: '',
//       contact_phone: ''
//     }
//   };
// }

// const badge = {
//   display: 'inline-block',
//   marginRight: '6px',
//   padding: '2px 6px',
//   fontSize: '0.75rem',
//   background: '#f0f0f0',
//   borderRadius: '3px',
//   color: '#333'
// };

// export default function ManageEvents() {
//   const [events, setEvents] = useState([]);
//   const [supplies, setSupplies] = useState({});
//   const [showForm, setShowForm] = useState({});
//   const [supplyForm, setSupplyForm] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     fetch(`${API_BASE}/api/events`)
//       .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
//       .then(data => {
//         setEvents(data);
//         data.forEach(evt => fetchSupplies(evt.id || evt.event_id));
//       })
//       .catch(e => setError(e.toString()))
//       .finally(() => setLoading(false));
//   }, []);

//   const fetchSupplies = eventId => {
//     fetch(`${API_BASE}/api/events/${eventId}/supplies`)
//       .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
//       .then(data => setSupplies(prev => ({ ...prev, [eventId]: data || [] })))
//       .catch(() => setSupplies(prev => ({ ...prev, [eventId]: [] })));
//   };

//   const handleShowForm = eventId => {
//     setShowForm(prev => ({ ...prev, [eventId]: !prev[eventId] }));
//     setSupplyForm(prev => ({ ...prev, [eventId]: blankSupply() }));
//   };

//   const handleFormChange = (eventId, e, isVendor = false) => {
//     const { name, value, type, checked } = e.target;
//     setSupplyForm(prev => ({
//       ...prev,
//       [eventId]: isVendor
//         ? { ...prev[eventId], vendor: { ...prev[eventId].vendor, [name]: value } }
//         : { ...prev[eventId], [name]: type === 'checkbox' ? checked : value }
//     }));
//   };

//   const handleAddSupply = async eventId => {
//     const form = supplyForm[eventId];
//     const payload = {
//       name: form.name,
//       quantity: parseInt(form.quantity, 10) || 0,
//       unitCost: parseFloat(form.unitCost) || 0,
//       notes: form.notes || null,
//       link: form.link || null,
//       reusable: form.reusable,
//       return_needed: form.return_needed,
//       vendor: {
//         company: form.vendor.company,
//         contact_name: form.vendor.contact_name || null,
//         contact_address: form.vendor.contact_address || null,
//         contact_email: form.vendor.contact_email || null,
//         contact_phone: form.vendor.contact_phone || null
//       }
//     };

//     await fetch(`${API_BASE}/api/events/${eventId}/supplies`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
//     fetchSupplies(eventId);
//     setShowForm(prev => ({ ...prev, [eventId]: false }));
//   };

//   if (loading) return <Layout><p>Loading…</p></Layout>;
//   if (error)   return <Layout><p style={{ color: 'crimson' }}>Error: {error}</p></Layout>;

//   return (
//     <Layout>
//       <div style={{ maxWidth: 1000, margin: '40px auto' }}>
//         <h1>Manage Events & Supplies</h1>
//         <div style={{ display: 'grid', gap: 24 }}>
//           {events.map(evt => {
//             const eventId = evt.id || evt.event_id;
//             const form    = supplyForm[eventId] || blankSupply();
//             const list    = supplies[eventId] || [];

//             return (
//               <div key={eventId} style={{ padding:24, borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', background:'white' }}>
//                 <h2 style={{ marginBottom:6 }}>{evt.name || evt.title || `Event #${eventId}`}</h2>
//                 {Object.entries(evt).map(([k,v]) => (
//                   <p key={k} style={{ margin:'2px 0', fontSize:'0.92rem' }}>
//                     <strong>{k.replace(/_/g,' ')}:</strong> {v == null ? '—' : String(v)}
//                   </p>
//                 ))}

//                 <h3 style={{ marginTop:12, marginBottom:4 }}>Supplies</h3>
//                 <ul style={{ listStyle:'none', padding:0 }}>
//                   {list.length === 0 && (<li style={{ color:'#aaa' }}>No supplies</li>)}
//                   {list.map((s,i) => (
//                     <li key={i} style={{ marginBottom:16 }}>
//                       <div style={{ display:'flex', justifyContent:'space-between' }}>
//                         <div>
//                           <strong>{s.name}</strong>{' '}
//                           {/* <span style={{ color:'#666' }}>×{s.quantity}</span> */}

//                           <div style={{ fontSize:'0.9rem', marginTop:4 }}>
//                             <span>Unit: ${(parseFloat(s.unitCost) || 0).toFixed(2)}</span>{' • '}
//                             <span>Total: ${( (s.quantity || 0) * (parseFloat(s.unitCost) || 0) ).toFixed(2)}</span>
//                           </div>

//                           <div style={{ marginTop:4, fontSize:'0.9rem' }}>
//                             {s.reusable && <span style={badge}>Reusable</span>}
//                             {s.return_needed && <span style={badge}>Return Needed</span>}
//                             {s.link && (
//                               <a href={s.link} target="_blank" rel="noopener noreferrer"
//                                  style={{ marginLeft:8, color:'#007bff', textDecoration:'underline' }}>
//                                 Link
//                               </a>
//                             )}
//                           </div>
//                         </div>

//                         {/* <div style={{ textAlign:'right', fontSize:'0.9rem', color:'#333' }}>
//                           Vendor:<br/>
//                           <strong>{s.vendor?.company || '—'}</strong>
//                         </div> */}
//                       </div>
//                     </li>
//                   ))}
//                 </ul>

//                 <button
//                   onClick={() => handleShowForm(eventId)}
//                   style={{ marginTop:10, background:'#ff8937', color:'#fff', padding:'7px 15px', border:'none', borderRadius:4, cursor:'pointer' }}
//                 >
//                   {showForm[eventId] ? 'Cancel' : '+ Add Supply'}
//                 </button>

//                 {showForm[eventId] && (
//                   <div style={{ border:'1px solid #eee', marginTop:15, borderRadius:6, padding:12, background:'#faf8f4' }}>
//                     <h4>Add Supply</h4>
//                     <input placeholder="Item Name" name="name" value={form.name}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Quantity" name="quantity" type="number" value={form.quantity}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Unit Cost" name="unitCost" type="number" step="0.01"
//                       value={form.unitCost} onChange={e => handleFormChange(eventId, e)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <textarea placeholder="Notes" name="notes" rows={2} value={form.notes}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Link" name="link" value={form.link}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <label><input type="checkbox" name="reusable" checked={form.reusable}
//                       onChange={e => handleFormChange(eventId, e)} /> Reusable</label>
//                     <label style={{ marginLeft:14 }}><input type="checkbox" name="return_needed"
//                       checked={form.return_needed} onChange={e => handleFormChange(eventId, e)} /> Return needed</label>

//                     <h5 style={{ marginTop:12 }}>Vendor Info</h5>
//                     <input placeholder="Company" name="company" value={form.vendor.company}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Contact Name" name="contact_name" value={form.vendor.contact_name}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Contact Address" name="contact_address"
//                       value={form.vendor.contact_address}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Contact Email" name="contact_email" type="email"
//                       value={form.vendor.contact_email}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width:'100%', marginBottom:6 }} />
//                     <input placeholder="Contact Phone" name="contact_phone" type="tel"
//                       value={form.vendor.contact_phone}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width:'100%', marginBottom:6 }} />

//                     <button
//                       onClick={() => handleAddSupply(eventId)}
//                       style={{ marginTop:12, background:'#28a745', color:'#fff', padding:'8px 16px', border:'none', borderRadius:4, cursor:'pointer' }}
//                     >Add Supply</button>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </Layout>
//   );
// }

// import React, { useState, useEffect } from 'react';
// import Layout from '../components/Layout';

// const API_BASE = import.meta.env.VITE_API_URL || '';

// function blankSupply() {
//   return {
//     name: '',
//     quantity: '',
//     unitCost: '',
//     notes: '',
//     link: '',
//     reusable: false,
//     return_needed: false,
//     vendor: {
//       company: '',
//       contact_name: '',
//       contact_address: '',
//       contact_email: '',
//       contact_phone: ''
//     }
//   };
// }

// export default function ManageEvents() {
//   const [events, setEvents] = useState([]);
//   const [supplies, setSupplies] = useState({}); // { [eventId]: [supply, ...] }
//   const [showForm, setShowForm] = useState({}); // { [eventId]: true/false }
//   const [supplyForm, setSupplyForm] = useState({}); // { [eventId]: supplyObj }
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch all events
//   useEffect(() => {
//     fetch(`${API_BASE}/api/events`)
//       .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
//       .then(data => {
//         setEvents(data);
//         // Initialize for each event
//         data.forEach(evt => {
//           fetchSupplies(evt.id || evt.event_id);
//         });
//       })
//       .catch(e => setError(e.toString()))
//       .finally(() => setLoading(false));
//     // eslint-disable-next-line
//   }, []);

//   // Fetch supplies for a given event
//   const fetchSupplies = (eventId) => {
//     fetch(`${API_BASE}/api/events/${eventId}/supplies`)
//       .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
//       .then(data => setSupplies(prev => ({ ...prev, [eventId]: data || [] })))
//       .catch(() => setSupplies(prev => ({ ...prev, [eventId]: [] })));
//   };

//   // Show form for this event
//   const handleShowForm = (eventId) => {
//     setShowForm(prev => ({ ...prev, [eventId]: !prev[eventId] }));
//     setSupplyForm(prev => ({ ...prev, [eventId]: blankSupply() }));
//   };

//   // Handle form field change
//   const handleFormChange = (eventId, e, isVendor = false) => {
//     const { name, value, type, checked } = e.target;
//     setSupplyForm(prev => ({
//       ...prev,
//       [eventId]: isVendor
//         ? {
//             ...prev[eventId],
//             vendor: {
//               ...prev[eventId].vendor,
//               [name]: value
//             }
//           }
//         : {
//             ...prev[eventId],
//             [name]: type === 'checkbox' ? checked : value
//           }
//     }));
//   };

//   // Add supply
//   const handleAddSupply = async (eventId) => {
//     const form = supplyForm[eventId];
//     const payload = {
//       name: form.name,
//       quantity: parseInt(form.quantity, 10) || 0,
//       unitCost: parseFloat(form.unitCost) || 0,
//       notes: form.notes || null,
//       link: form.link || null,
//       reusable: form.reusable,
//       return_needed: form.return_needed,
//       vendor: {
//         company: form.vendor.company,
//         contact_name: form.vendor.contact_name || null,
//         contact_address: form.vendor.contact_address || null,
//         contact_email: form.vendor.contact_email || null,
//         contact_phone: form.vendor.contact_phone || null
//       }
//     };
//     console.log('🛰️ AddSupply Payload →', JSON.stringify(payload, null, 2));
//     await fetch(`${API_BASE}/api/events/${eventId}/supplies`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
//     fetchSupplies(eventId); // refresh
//     setShowForm(prev => ({ ...prev, [eventId]: false }));
//   };

//   if (loading) return <Layout><p>Loading…</p></Layout>;
//   if (error) return <Layout><p style={{ color: 'crimson' }}>Error: {error}</p></Layout>;

//   return (
//     <Layout>
//       <div style={{ maxWidth: 1000, margin: '40px auto' }}>
//         <h1>Manage Events & Supplies</h1>
//         <div style={{ display: 'grid', gap: 24 }}>
//           {events.map(evt => {
//             const eventId = evt.id || evt.event_id;
//             const form = supplyForm[eventId] || blankSupply();
//             return (
//               <div
//                 key={eventId}
//                 style={{
//                   padding: 24,
//                   borderRadius: 8,
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                   background: 'white'
//                 }}
//               >
//                 <h2 style={{ marginBottom: 6 }}>{evt.title || evt.name || `Event #${eventId}`}</h2>
//                 {/* Show all fields */}
//                 {Object.entries(evt).map(([key, val]) => (
//                   <p key={key} style={{ margin: '2px 0', fontSize: '0.92rem' }}>
//                     <strong>{key.replace(/_/g, ' ')}:</strong> {val === null ? '—' : String(val)}
//                   </p>
//                 ))}
//                 <h3 style={{ marginTop: 12, marginBottom: 4 }}>Supplies</h3>
//                 <ul>
//                   {(supplies[eventId] || []).length === 0 && <li style={{ color: '#aaa' }}>No supplies</li>}
//                   {(supplies[eventId] || []).map((s, i) => (
//                     <li key={i} style={{ marginBottom: 6 }}>
//                       <b>{s.name}</b> — Qty: {s.quantity}, Vendor: {s.vendor?.company}
//                     </li>
//                   ))}
//                 </ul>
//                 <button
//                   onClick={() => handleShowForm(eventId)}
//                   style={{
//                     marginTop: 10,
//                     background: '#ff8937',
//                     color: '#fff',
//                     padding: '7px 15px',
//                     border: 'none',
//                     borderRadius: 4,
//                     cursor: 'pointer'
//                   }}
//                 >
//                   {showForm[eventId] ? 'Cancel' : '+ Add Supply'}
//                 </button>
//                 {showForm[eventId] && (
//                   <div style={{
//                     border: '1px solid #eee', marginTop: 15, borderRadius: 6, padding: 12,
//                     background: '#faf8f4'
//                   }}>
//                     <h4>Add Supply</h4>
//                     <input
//                       placeholder="Item Name"
//                       name="name"
//                       value={form.name}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Quantity"
//                       name="quantity"
//                       type="number"
//                       value={form.quantity}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Unit Cost"
//                       name="unitCost"
//                       type="number"
//                       step="0.01"
//                       value={form.unitCost}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <textarea
//                       placeholder="Notes"
//                       name="notes"
//                       rows={2}
//                       value={form.notes}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Link"
//                       name="link"
//                       value={form.link}
//                       onChange={e => handleFormChange(eventId, e)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <label>
//                       <input
//                         type="checkbox"
//                         name="reusable"
//                         checked={form.reusable}
//                         onChange={e => handleFormChange(eventId, e)}
//                       /> Reusable
//                     </label>
//                     <label style={{ marginLeft: 14 }}>
//                       <input
//                         type="checkbox"
//                         name="return_needed"
//                         checked={form.return_needed}
//                         onChange={e => handleFormChange(eventId, e)}
//                       /> Return needed
//                     </label>
//                     <h5 style={{ marginTop: 12 }}>Vendor Info</h5>
//                     <input
//                       placeholder="Company"
//                       name="company"
//                       value={form.vendor.company}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Contact Name"
//                       name="contact_name"
//                       value={form.vendor.contact_name}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Contact Address"
//                       name="contact_address"
//                       value={form.vendor.contact_address}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Contact Email"
//                       name="contact_email"
//                       type="email"
//                       value={form.vendor.contact_email}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <input
//                       placeholder="Contact Phone"
//                       name="contact_phone"
//                       type="tel"
//                       value={form.vendor.contact_phone}
//                       onChange={e => handleFormChange(eventId, e, true)}
//                       style={{ width: '100%', marginBottom: 6 }}
//                     />
//                     <button
//                       onClick={() => handleAddSupply(eventId)}
//                       style={{
//                         marginTop: 12,
//                         background: '#28a745',
//                         color: '#fff',
//                         padding: '8px 16px',
//                         border: 'none',
//                         borderRadius: 4,
//                         cursor: 'pointer'
//                       }}
//                     >
//                       Add Supply
//                     </button>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </Layout>
//   );
// }
