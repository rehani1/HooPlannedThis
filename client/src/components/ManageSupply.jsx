import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [items, setItems]   = useState({});   // { [eventId]: [item,…] }
  const [showForm, setShowForm] = useState({});// { [eventId]: bool }
  const [form, setForm] = useState({});        // { [eventId]: itemData }

  // 1) Load events + for each, load items
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
        event_id: eventId,
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
    const payload = form[eventId];
    console.log('Submitting →', payload);
    await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    // reload items
    const data = await fetch(`${API_BASE}/api/items?event_id=${eventId}`)
                     .then(r => r.json());
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
            <button onClick={() => openForm(evId)}>+ Add Item</button>

            {showForm[evId] && (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #ccc' }}>
                <input
                  name="name"
                  onChange={e => handleChange(evId, e)}
                  placeholder="Item Name"
                />
                <input
                  name="quantity"
                  type="number"
                  onChange={e => handleChange(evId, e)}
                  placeholder="Quantity"
                />
                <input
                  name="unitCost"
                  type="number"
                  onChange={e => handleChange(evId, e)}
                  placeholder="Unit Cost"
                />
                <input
                  name="notes"
                  onChange={e => handleChange(evId, e)}
                  placeholder="Notes"
                />
                <input
                  name="link"
                  onChange={e => handleChange(evId, e)}
                  placeholder="Link"
                />
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
                <h4>Vendor Info</h4>
                <input
                  name="company"
                  onChange={e => handleChange(evId, e, true)}
                  placeholder="Company"
                />
                <input
                  name="contact_name"
                  onChange={e => handleChange(evId, e, true)}
                  placeholder="Contact Name"
                />
                <input
                  name="contact_address"
                  onChange={e => handleChange(evId, e, true)}
                  placeholder="Contact Address"
                />
                <input
                  name="contact_email"
                  type="email"
                  onChange={e => handleChange(evId, e, true)}
                  placeholder="Contact Email"
                />
                <input
                  name="contact_phone"
                  type="tel"
                  onChange={e => handleChange(evId, e, true)}
                  placeholder="Contact Phone"
                />
                <button onClick={() => submitItem(evId)} style={{ marginTop: 12 }}>
                  Save
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
