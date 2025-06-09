import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarIcon from '../components/CalendarIcon';
import CalendarComponent from '../components/CalendarComponent';
import AddressForm from '../components/Mapbox/AddressForm';
import Map from '../components/Mapbox/Map';
import "mapbox-gl/dist/mapbox-gl.css";

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    committee:'',
    budget:'',
    description: ''
  });
  
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  
  const [address, setAddress] = useState({
    streetAndNumber: "",
    place: "",
    region: "",
    postcode: "",
    country: "",
    latitude: "",
    longitude: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted Event:', formData);
    // TODO: send formData to your backend using fetch or axios
  };

  const openLocationPopup = () => {
    setShowLocationPopup(true);
  };

  const closeLocationPopup = () => {
    setShowLocationPopup(false);
  };

  const handleAddressSubmit = (event) => {
    event.preventDefault();
    if (address.streetAndNumber) {
      console.log("Selected address:", address);
      // Set the location in the form
      const fullAddress = `${address.streetAndNumber}, ${address.place}, ${address.region} ${address.postcode}, ${address.country}`;
      setFormData(prev => ({ ...prev, location: fullAddress }));
      closeLocationPopup();
    }
  };

  const updateCoordinates = (latitude, longitude) => {
    setAddress({ ...address, latitude, longitude });
  };

  return (
    <Layout>
      <div style={{ padding: '40px' }}>
        <h1>Create a New Event</h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginTop: '20px' }}>
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Committee:
            <input
              type="text"
              name="committee"
              value={formData.committee}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Date:
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Start Time:
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            End Time:
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Location:
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              onClick={openLocationPopup}
              placeholder="Click to browse locations 📍"
              required
              style={{ 
                width: '100%', 
                marginBottom: '12px',
                font: 'Montserrat', 
                cursor: 'pointer',
                backgroundColor: '#f8f9fa',
                border: '1px solid #007bff'
              }}
              readOnly
            />
          </label>
          <label>
            Budget ($):
            <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                placeholder="$0.00"
                step="0.01"
                min="0"
                style={{ width: '100%', marginBottom: '12px' }}
            />
            </label>
          <label>
            Description:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <button type="submit" style={{
            backgroundColor: '#ff8937',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            Submit Event
          </button>
        </form>

        {showLocationPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '600px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3>Select Location</h3>
                <button
                  onClick={closeLocationPopup}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              
              <AddressForm
                onSubmit={handleAddressSubmit}
                address={address}
                setAddress={setAddress}
              />

              {/* <div style={{ marginTop: '20px' }}>
                <Map
                  longitude={address.longitude}
                  latitude={address.latitude}
                  updateCoordinates={updateCoordinates}
                />
              </div> */}
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={closeLocationPopup}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddressSubmit}
                  style={{
                    backgroundColor: '#ff8937',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Use This Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateEvent;