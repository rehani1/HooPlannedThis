import React, { useState } from 'react';
import Layout from '../components/Layout';
import Map from '../components/Mapbox/Map';
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token from .env.local (must start VITE_ prefix for Vite)
mapboxgl.accessToken = import.meta.env.VITE_TOKEN;


/**
 * Composite form for Event, Location, and Vendor
 * Maps fields to API payload matching server/models/event.js createEvent
 */
const EventLocationVendorForm = ({ onSubmit }) => {
  // Event fields
  const [event, setEvent] = useState({
    name: '',           // maps to Event.name
    eventDate: '',      // maps to Event.event_date
    eventTime: '',      // maps to Event.event_time
    description: '',    // maps to Event.description
    budgetAllocated: '',// maps to Event.budget_allocated
    committeeId: '',    // maps to Event.committee_id
  });

  // Location fields
  const [location, setLocation] = useState({
    name: '',                // maps to Location.name
    address: '',             // maps to Location.address
    city: '',                // maps to Location.city
    state: '',               // maps to Location.state
    zipcode: '',             // maps to Location.zipcode
    venueEmail: '',          // maps to Location.venue_email
    latitude: '',
    longitude: '',
  });

  // Vendor fields
  const [vendor, setVendor] = useState({
    companyName: '',     // maps to Vendor.company_name
    contactName: '',     // maps to Vendor.contact_name
    contactAddress: '',  // maps to Vendor.contact_address
    contactEmail: '',    // maps to Vendor.contact_email
    contactPhone: '',    // maps to Vendor.contact_phone
  });

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setLocation(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendor(prev => ({ ...prev, [name]: value }));
  };

  const updateCoordinates = (lat, lng) => {
    setLocation(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build payload matching backend createEvent
    const payload = {
      // Event
      title: event.name,
      date: event.eventDate,
      startTime: event.eventTime,
      description: event.description || null,
      budget: parseFloat(event.budgetAllocated) || 0.00,
      committeeId: parseInt(event.committeeId, 10),
      // Location
      locationName: location.name,
      locationAddress: location.address,
      city: location.city,
      state: location.state,
      zipcode: location.zipcode,
      venueEmail: location.venueEmail || null,
      latitude: location.latitude || null,
      longitude: location.longitude || null,
      // Vendor (will upsert separately)
      vendor: {
        company: vendor.companyName,
        contact_name: vendor.contactName || null,
        contact_address: vendor.contactAddress || null,
        contact_email: vendor.contactEmail || null,
        contact_phone: vendor.contactPhone || null,
      }
    };
    onSubmit(payload);
  };

  return (
    <Layout>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '40px auto' }}>

        <h1>Event</h1>
        <label>
          Name *:
          <input
            type="text"
            name="name"
            value={event.name}
            onChange={handleEventChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
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
            style={{ width: '100%', marginBottom: '12px' }}
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
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Description:
          <textarea
            name="description"
            value={event.description}
            onChange={handleEventChange}
            rows={3}
            style={{ width: '100%', marginBottom: '12px' }}
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
            style={{ width: '100%', marginBottom: '12px' }}
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
            style={{ width: '100%', marginBottom: '24px' }}
          />
        </label>

        <h1>Location</h1>
        <label>
          Location Name *:
          <input
            type="text"
            name="name"
            value={location.name}
            onChange={handleLocationChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Address *:
          <input
            type="text"
            name="address"
            value={location.address}
            onChange={handleLocationChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          City *:
          <input
            type="text"
            name="city"
            value={location.city}
            onChange={handleLocationChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          State *:
          <input
            type="text"
            name="state"
            value={location.state}
            onChange={handleLocationChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Zip Code *:
          <input
            type="text"
            name="zipcode"
            value={location.zipcode}
            onChange={handleLocationChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Venue Email:
          <input
            type="email"
            name="venueEmail"
            value={location.venueEmail}
            onChange={handleLocationChange}
            style={{ width: '100%', marginBottom: '24px' }}
          />
        </label>

        <div style={{ height: '300px', marginBottom: '40px' }}>
          <Map
            latitude={parseFloat(location.latitude) || 0}
            longitude={parseFloat(location.longitude) || 0}
            updateCoordinates={updateCoordinates}
          />
        </div>

        <h1>Vendor</h1>
        <label>
          Company Name *:
          <input
            type="text"
            name="companyName"
            value={vendor.companyName}
            onChange={handleVendorChange}
            required
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Contact Name:
          <input
            type="text"
            name="contactName"
            value={vendor.contactName}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Contact Address:
          <input
            type="text"
            name="contactAddress"
            value={vendor.contactAddress}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Contact Email:
          <input
            type="email"
            name="contactEmail"
            value={vendor.contactEmail}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: '12px' }}
          />
        </label>
        <label>
          Contact Phone:
          <input
            type="tel"
            name="contactPhone"
            value={vendor.contactPhone}
            onChange={handleVendorChange}
            style={{ width: '100%', marginBottom: '16px' }}
          />
        </label>

        <button
          type="submit"
          style={{
            backgroundColor: '#ff8937',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Create Event + Location + Vendor
        </button>
      </form>
    </Layout>
  );
};

export default EventLocationVendorForm;
