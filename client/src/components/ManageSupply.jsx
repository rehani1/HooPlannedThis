// src/pages/ManageEvents.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [items, setItems]   = useState({});   // { [eventId]: [item,…] }
  const [showForm, setShowForm] = useState({});// { [eventId]: bool }
  const [form, setForm] = useState({});        // { [eventId]: itemData }

  
  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(r => r.json())
      .then(evts => {
        setEvents(evts);
        evts.forEach(evt => {
          fetch(`${API_BASE}/api/items?event_id=${evt.event_id}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
            .then(data => setItems(prev => ({ ...prev, [evt.event_id]: data })));
        });
      });
  }, []);

  const openForm = eventId => {
    setForm(prev => ({
      ...prev,
      [eventId]: {
        name: '',
        quantity: 0,
        unitCost: 0,
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
      }
    }));
    setShowForm(sf => ({ ...sf, [eventId]: true }));
  };

  const handleChange = (eventId, e, isVendor = false) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const curr = prev[eventId];
      if (isVendor) {
        return {
          ...prev,
          [eventId]: {
            ...curr,
            vendor: { ...curr.vendor, [name]: value }
          }
        };
      }
      return {
        ...prev,
        [eventId]: {
          ...curr,
          [name]: type === 'checkbox' ? checked : (type === 'number' ? +value : value)
        }
      };
    });
  };

  const submitItem = async eventId => {
    // include event_id in the payload
    const payload = {
      event_id: eventId,
      ...form[eventId]
    };
    console.log('Submitting →', payload);

    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // reload items
    const data = await fetch(`${API_BASE}/api/items?event_id=${eventId}`)
                     .then(r => r.ok ? r.json() : Promise.reject(r.statusText));
    setItems(prev => ({ ...prev, [eventId]: data }));
    setShowForm(sf => ({ ...sf, [eventId]: false }));
  };

  return (
    <Layout>
      <h1>Manage Events & Supplies</h1>
      {events.map(evt => {
        const evId = evt.event_id;
        return (
          <div key={evId} style={{ marginBottom: 32 }}>
            <h2>{evt.name}</h2>
            <button onClick={() => openForm(evId)}>+ Add Supply</button>

            {showForm[evId] && (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #ccc' }}>
                <label>
                  Item Name
                  <input
                    name="name"
                    onChange={e => handleChange(evId, e)}
                    placeholder="Item Name"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Quantity
                  <input
                    name="quantity"
                    type="number"
                    onChange={e => handleChange(evId, e)}
                    placeholder="Quantity"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Unit Cost
                  <input
                    name="unitCost"
                    type="number"
                    onChange={e => handleChange(evId, e)}
                    placeholder="Unit Cost"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    name="notes"
                    onChange={e => handleChange(evId, e)}
                    placeholder="Notes"
                    rows={2}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Link
                  <input
                    name="link"
                    onChange={e => handleChange(evId, e)}
                    placeholder="Link"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  <input
                    name="reusable"
                    type="checkbox"
                    onChange={e => handleChange(evId, e)}
                  /> Reusable
                </label>
                <label style={{ marginLeft: 12 }}>
                  <input
                    name="return_needed"
                    type="checkbox"
                    onChange={e => handleChange(evId, e)}
                  /> Return Needed
                </label>

                <h4 style={{ marginTop: 12 }}>Vendor Info</h4>
                <label>
                  Company
                  <input
                    name="company"
                    onChange={e => handleChange(evId, e, true)}
                    placeholder="Company"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Contact Name
                  <input
                    name="contact_name"
                    onChange={e => handleChange(evId, e, true)}
                    placeholder="Contact Name"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Contact Address
                  <input
                    name="contact_address"
                    onChange={e => handleChange(evId, e, true)}
                    placeholder="Contact Address"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Contact Email
                  <input
                    name="contact_email"
                    type="email"
                    onChange={e => handleChange(evId, e, true)}
                    placeholder="Contact Email"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>
                <label>
                  Contact Phone
                  <input
                    name="contact_phone"
                    type="tel"
                    onChange={e => handleChange(evId, e, true)}
                    placeholder="Contact Phone"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                </label>

                <button onClick={() => submitItem(evId)} style={{ marginTop: 12 }}>
                  Add Supply
                </button>
              </div>
            )}

            <ul style={{ marginTop: 16 }}>
              {(items[evId] || []).map(item => (
                <li key={item.id}>
                  {item.name} — {item.quantity} × ${item.unitCost.toFixed(2)}
                  {item.vendor.company && ` (Vendor: ${item.vendor.company})`}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </Layout>
  );
}