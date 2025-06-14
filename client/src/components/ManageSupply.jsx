import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function ManageEvents() {
  const [events, setEvents]     = useState([]);
  const [supplies, setSupplies] = useState({});
  const [showForm, setShowForm] = useState({});
  const [form, setForm]         = useState({}); // { [eventId]: supply }

  // 1) Load events + for each, load supplies
  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(r => r.json())
      .then(evts => {
        setEvents(evts);
        evts.forEach(evt => {
          fetch(`${API_BASE}/api/events/${evt.event_id}/supplies`)
            .then(r => r.json())
            .then(data => setSupplies(s => ({ ...s, [evt.event_id]: data })));
        });
      });
  }, []);

  const openForm = (eventId) => {
    setForm(f => ({ 
      ...f, 
      [eventId]: { name:'', quantity:0, unitCost:0, notes:'', link:'', reusable:false, return_needed:false, vendor:{ company:'', contact_name:'', contact_address:'', contact_email:'', contact_phone:'' } }
    }));
    setShowForm(sf => ({ ...sf, [eventId]: true }));
  };

  const handleChange = (eventId, e, isVendor=false) => {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const curr = f[eventId];
      if (isVendor) {
        return {
          ...f,
          [eventId]: {
            ...curr,
            vendor: { ...curr.vendor, [name]: value }
          }
        };
      }
      return {
        ...f,
        [eventId]: {
          ...curr,
          [name]: type==='checkbox' ? checked : (type==='number' ? +value : value)
        }
      };
    });
  };

  const submitSupply = async (eventId) => {
    const payload = form[eventId];
    console.log('Submitting →', payload);
    await fetch(`${API_BASE}/api/events/${eventId}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    // reload supplies
    const data = await fetch(`${API_BASE}/api/events/${eventId}/supplies`).then(r=>r.json());
    setSupplies(s => ({ ...s, [eventId]: data }));
    setShowForm(sf => ({ ...sf, [eventId]: false }));
  };

  return (
    <Layout>
      <h1>Manage Events & Supplies</h1>
      {events.map(evt => {
        const evId = evt.event_id;
        return (
          <div key={evId}>
            <h2>{evt.name}</h2>
            <button onClick={()=>openForm(evId)}>+ Add Supply</button>
            {showForm[evId] && (
              <div>
                <input name="name"        onChange={e=>handleChange(evId,e)} placeholder="Item" />
                <input name="quantity"    type="number" onChange={e=>handleChange(evId,e)} placeholder="Qty" />
                <input name="unitCost"    type="number" onChange={e=>handleChange(evId,e)} placeholder="Cost" />
                <input name="notes"       onChange={e=>handleChange(evId,e)} placeholder="Notes" />
                {/* vendor */}
                <input name="company"     onChange={e=>handleChange(evId,e,true)} placeholder="Vendor Co" />
                <input name="contact_name"onChange={e=>handleChange(evId,e,true)} placeholder="Vendor Name" />
                {/* …other vendor fields… */}
                <button onClick={()=>submitSupply(evId)}>Save</button>
              </div>
            )}
            <ul>
              {(supplies[evId]||[]).map(s => (
                <li key={s.id}>
                  {s.name} — {s.quantity} @ ${s.unitCost}  Vendor: {s.vendor.company}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </Layout>
  );
}
