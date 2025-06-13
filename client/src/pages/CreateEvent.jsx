// src/pages/CreateEvent.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarComponent from '../components/CalendarComponent';
import AddressForm from '../components/Mapbox/AddressForm';
import Map from '../components/Mapbox/Map';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    description: '',
    budget: '',
    committeeId: '',
    // location fields:
    locationName: '',
    locationAddress: '',
    city: '',
    state: '',
    zipcode: '',
    venueEmail: '',
  });

  const [supplies, setSupplies] = useState([]);
  const [currentSupply, setCurrentSupply] = useState({
    name: '',
    quantity: 1,
    unitCost: 0,
    notes: '',
    link: '',
    reusable: false,
    return_needed: false,
    vendor: { company: '', contact_name: '', contact_address: '', contact_email: '', contact_phone: '' }
  });

  // handlers for the main form
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(d => ({ ...d, [name]: value }));
  };

  // supply logic omitted for brevity — assume you push completed `currentSupply` into `supplies`

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      // map your formData into what the server wants:
      title:           formData.title,
      date:            formData.date,
      startTime:       formData.startTime,
      description:     formData.description,
      budget:          parseFloat(formData.budget) || 0,
      committeeId:     parseInt(formData.committeeId, 10) || 0,

      // location table columns:
      locationName:    formData.locationName,
      locationAddress: formData.locationAddress,
      city:            formData.city,
      state:           formData.state,
      zipcode:         formData.zipcode,
      venueEmail:      formData.venueEmail,

      // supplies array as-is (each item has vendor.company etc)
      supplies
    };

    console.log('📦 eventData payload →', payload);

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('❌ backend text error:', errText);
        throw new Error(`Request failed ${res.status}`);
      }

      const { id } = await res.json();
      alert('Event created! ID: ' + id);
    } catch (err) {
      console.error('❌ createEvent error', err);
      alert(`Request failed: ${err.message}`);
    }
  };

  return (
    <Layout>
      <div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
        <h1>Create a New Event</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input name="title" value={formData.title} onChange={handleChange} required />
          </label>

          <label>
            Committee ID
            <input name="committeeId" value={formData.committeeId} onChange={handleChange} required type="number" />
          </label>

          <label>
            Date
            <input name="date" type="date" value={formData.date} onChange={handleChange} required />
          </label>

          <label>
            Start Time
            <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
          </label>

          <label>
            Description
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </label>

          <label>
            Budget ($)
            <input
              name="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={handleChange}
            />
          </label>

          <fieldset style={{ marginTop: 20 }}>
            <legend>Location Details</legend>

            <label>
              Venue Name
              <input name="locationName" value={formData.locationName} onChange={handleChange} />
            </label>

            <label>
              Address
              <input name="locationAddress" value={formData.locationAddress} onChange={handleChange} />
            </label>

            <label>
              City
              <input name="city" value={formData.city} onChange={handleChange} />
            </label>

            <label>
              State
              <input name="state" value={formData.state} onChange={handleChange} />
            </label>

            <label>
              Zipcode
              <input name="zipcode" value={formData.zipcode} onChange={handleChange} />
            </label>

            <label>
              Venue Email
              <input name="venueEmail" type="email" value={formData.venueEmail} onChange={handleChange} />
            </label>
          </fieldset>

          {/* Supplies UI here… */}
          {/* For brevity, I’ve omitted the full pop-up logic — just be sure that `supplies` ends up an array of your supply objects */}

          <button type="submit" style={{ marginTop: 24, padding: '10px 20px' }}>
            Submit Event
          </button>
        </form>
      </div>
    </Layout>
  );
}
