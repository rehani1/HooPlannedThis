import React, { useState } from 'react';
import Layout from '../components/Layout';
import AddressForm from '../components/Mapbox/AddressForm';
import "mapbox-gl/dist/mapbox-gl.css";

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function CreateEvent() {
  // Event
  const [event, setEvent] = useState({
    name: '',
    eventDate: '',
    eventTime: '',
    description: '',
    budgetAllocated: '',
    committeeId: ''
  });

  // Location
  const [location, setLocation] = useState({
    locationName: '',
    streetAndNumber: '',
    place: '',
    region: '',
    postcode: '',
    latitude: '',
    longitude: ''
  });

  // Vendor
  const [vendor, setVendor] = useState({
    companyName: '',
    contactName: '',
    contactAddress: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleEventChange = e => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationNameChange = e => {
    setLocation(prev => ({ ...prev, locationName: e.target.value }));
  };

  const handleVendorChange = e => {
    const { name, value } = e.target;
    setVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const payload = {
      // Event
      title: event.name,
      date: event.eventDate,
      startTime: event.eventTime,
      description: event.description || null,
      budget: parseFloat(event.budgetAllocated) || 0,
      committeeId: parseInt(event.committeeId, 10),

      // Location
      locationName: location.locationName,
      locationAddress: location.streetAndNumber,
      city: location.place,
      state: location.region,
      zipcode: location.postcode,
      venueEmail: null,
      latitude: location.latitude || null,
      longitude: location.longitude || null,

      // Supplies (if any)
      supplies: [],

      // Vendor
      vendor: {
        company: vendor.companyName,
        contact_name: vendor.contactName || null,
        contact_address: vendor.contactAddress || null,
        contact_email: vendor.contactEmail || null,
        contact_phone: vendor.contactPhone || null
      }
    };

    // DEBUG: inspect exactly what we're sending
    console.log('🛰️ Payload →', JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', res.status, res.statusText);
      const text = await res.text();
      console.log('📡 Response body:', text);

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { id } = JSON.parse(text);
      alert(`Event created with ID ${id}`);
    } catch (err) {
      console.error('❌ Failed to create event:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '40px auto' }}>
        <h1>Event</h1>
        <label>
          Name *:
          <input
            type="text"
            name="name"
            value={event.name}
            onChange={handleEventChange}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Date *:
          <input
            type="date"
            name="eventDate"
            value={event.eventDate}
            onChange={handleEventChange}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Time *:
          <input
            type="time"
            name="eventTime"
            value={event.eventTime}
            onChange={handleEventChange}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Description:
          <textarea
            name="description"
            value={event.description}
            onChange={handleEventChange}
            rows={3}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Budget ($):
          <input
            type="number"
            name="budgetAllocated"
            value={event.budgetAllocated}
            onChange={handleEventChange}
            step="0.01"
            min="0"
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Committee ID *:
          <input
            type="number"
            name="committeeId"
            value={event.committeeId}
            onChange={handleEventChange}
            required
            style={{ width: '100%', marginBottom: 24 }}
          />
        </label>

        <h1>Location</h1>
        <label>
          Location Name *:
          <input
            type="text"
            name="locationName"
            value={location.locationName}
            onChange={handleLocationNameChange}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <AddressForm address={location} setAddress={setLocation} />

        <h1>Vendor</h1>
        <label>
          Company Name *:
          <input
            type="text"
            name="companyName"
            value={vendor.companyName}
            onChange={handleVendorChange}
            required
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Contact Name:
          <input
            type="text"
            name="contactName"
            value={vendor.contactName}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Contact Address:
          <input
            type="text"
            name="contactAddress"
            value={vendor.contactAddress}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Contact Email:
          <input
            type="email"
            name="contactEmail"
            value={vendor.contactEmail}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </label>
        <label>
          Contact Phone:
          <input
            type="tel"
            name="contactPhone"
            value={vendor.contactPhone}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: 24 }}
          />
        </label>

        <button
          type="submit"
          style={{
            backgroundColor: '#ff8937',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Create Event + Location + Vendor
        </button>
      </form>
    </Layout>
  );
}
