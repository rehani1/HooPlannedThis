import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarIcon from '../components/CalendarIcon';
import CalendarComponent from '../components/CalendarComponent';
import AddressForm from '../components/Mapbox/AddressForm';
import Map from '../components/Mapbox/Map';
import "mapbox-gl/dist/mapbox-gl.css";
import api from '../api'; 

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    venueName: '',
    venueContact: '',
    location: '',
    committeeId:'',
    budget:'',
    description: ''
  });
  
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showSupplyPopup, setShowSupplyPopup] = useState(false);
  const [showVendorPopup, setShowVendorPopup] = useState(false);
  const [supplies, setSupplies] = useState([]);
  const [currentSupply, setCurrentSupply] = useState({
    name: '',
    quantity: '',
    unitCost: '',
    totalCost: '0.00',
    notes: '',
    link: '',
    reusable: false,
    return_needed: false,
    vendor: null
  });
  const [currentVendor, setCurrentVendor] = useState({
    company: '',
    contact_name: '',
    contact_address: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  });
  const [editingSupplyIndex, setEditingSupplyIndex] = useState(null);
  
  const [address, setAddress] = useState({
    streetAndNumber: "",
    place: "",
    region: "",
    postcode: "",
    country: "",
    latitude: "",
    longitude: "",
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // build payload matching new schema
    const eventData = {
      title        : formData.title,            // maps -> Event.name
      date         : formData.date,             // YYYY-MM-DD
      startTime    : formData.startTime,        // HH:MM / 24-h
      description  : formData.description,
      budget       : parseFloat(formData.budget) || 0,
      committeeId  : parseInt(formData.committee, 10) || 0,
      venueName    : formData.venueName,
      venueContact : formData.venueContact,
      location     : formData.location,         // street
      city         : selectedLocation?.city  ?? '',
      state        : selectedLocation?.state ?? '',
      zipcode      : selectedLocation?.zipcode ?? '',
      supplies     : supplies,                  // unchanged
      locationId   : null,                      // let backend upsert
    };
  
    console.log('📦 eventData payload →', eventData);
  
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(eventData),
      });
  
      if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText}`);
      alert('Event created!');
      // TODO: redirect
    } catch (err) {
      console.error('❌ createEvent error', err);
      alert(err.message || 'Failed to create event');
    }
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
      // Store the selected location with coordinates
      setSelectedLocation({
        address: fullAddress,
        latitude: address.latitude,
        longitude: address.longitude
      });
      closeLocationPopup();
    }
  };

  const updateCoordinates = (latitude, longitude) => {
    setAddress({ ...address, latitude, longitude });
  };

  // Supply management functions
  const openSupplyPopup = () => {
    setShowSupplyPopup(true);
    setEditingSupplyIndex(null);
    setCurrentSupply({
      name: '',
      quantity: '',
      unitCost: '',
      totalCost: '0.00',
      notes: '',
      link: '',
      reusable: false,
      return_needed: false,
      vendor: null
    });
  };

  const closeSupplyPopup = () => {
    setShowSupplyPopup(false);
    setEditingSupplyIndex(null);
    setCurrentSupply({
      name: '',
      quantity: '',
      unitCost: '',
      totalCost: '0.00',
      notes: '',
      link: '',
      reusable: false,
      return_needed: false,
      vendor: null
    });
  };

  const handleSupplyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentSupply(prev => {
      const updated = { 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      };
      
      // Auto-calculate total cost
      if (name === 'quantity' || name === 'unitCost') {
        const qty = parseFloat(name === 'quantity' ? value : prev.quantity) || 0;
        const unit = parseFloat(name === 'unitCost' ? value : prev.unitCost) || 0;
        updated.totalCost = (qty * unit).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleSupplySubmit = (e) => {
    e.preventDefault();
    if (currentSupply.name && currentSupply.quantity) {
      if (editingSupplyIndex !== null) {
        // Update existing supply
        const updatedSupplies = [...supplies];
        updatedSupplies[editingSupplyIndex] = currentSupply;
        setSupplies(updatedSupplies);
      } else {
        // Add new supply
        setSupplies([...supplies, currentSupply]);
      }
      closeSupplyPopup();
    }
  };

  const editSupply = (index) => {
    setCurrentSupply(supplies[index]);
    setEditingSupplyIndex(index);
    setShowSupplyPopup(true);
  };

  const deleteSupply = (index) => {
    setSupplies(supplies.filter((_, i) => i !== index));
  };

  const getTotalSuppliesCost = () => {
    return supplies.reduce((sum, supply) => sum + parseFloat(supply.totalCost || 0), 0).toFixed(2);
  };

  // Vendor management functions
  const openVendorPopup = () => {
    setShowVendorPopup(true);
    if (currentSupply.vendor) {
      setCurrentVendor(currentSupply.vendor);
    } else {
      setCurrentVendor({
        company: '',
        contact_name: '',
        contact_address: '',
        contact_email: '',
        contact_phone: '',
        notes:'',
      });
    }
  };

  const closeVendorPopup = () => {
    setShowVendorPopup(false);
    setCurrentVendor({
      company: '',
      contact_name: '',
      contact_address: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
    });
  };

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setCurrentVendor(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorSubmit = (e) => {
    e.preventDefault();
    if (currentVendor.company) {
      setCurrentSupply(prev => ({ ...prev, vendor: currentVendor }));
      closeVendorPopup();
    }
  };

  const removeVendor = () => {
    setCurrentSupply(prev => ({ ...prev, vendor: null }));
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
              name="committeeId"
              value={formData.committeeId}
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
            Venue Name:
            <input
              type="text"
              name="venueName"
              value={formData.venueName}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Venue Contact:
            <input
              type="text"
              name="venueContact"
              value={formData.venueContact}
              onChange={handleChange}
              required
              style={{ width: '100%', marginBottom: '12px' }}
            />
          </label>
          <label>
            Venue Address:
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              onClick={openLocationPopup}
              placeholder="Click to browse locations"
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
          
          {/* Map Preview */}
          {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
            <div style={{ 
              marginBottom: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px', 
                marginBottom: '8px',
                color: '#666'
              }}>
                <span>Location Preview:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, location: '' }));
                    setSelectedLocation(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  Clear Location
                </button>
              </div>
              <div style={{ 
                width: '300px',            
                height: '300px',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                margin: '0 auto',    
              }}>
                
                <Map
                  longitude={selectedLocation.longitude}
                  latitude={selectedLocation.latitude}
                  updateCoordinates={() => {}}
                />
              </div>
            </div>
          )}
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
          
          {/* Supplies Section */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ marginBottom: 0 }}>Supplies:</label>
              <button
                type="button"
                onClick={openSupplyPopup}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                + Add Supply
              </button>
            </div>
            
            {supplies.length > 0 && (
              <>
                <div style={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '4px', 
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  {supplies.map((supply, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px',
                      borderBottom: index < supplies.length - 1 ? '1px solid #e0e0e0' : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <strong>{supply.name}</strong>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Qty: {supply.quantity} × ${supply.unitCost} = ${supply.totalCost}
                        </div>
                        {supply.notes && (
                          <div style={{ fontSize: '12px', color: '#888' }}>{supply.notes}</div>
                        )}
                        {supply.vendor && (
                          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                            Vendor: {supply.vendor.company}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          {supply.reusable && (
                            <span style={{ 
                              backgroundColor: '#28a745', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: '3px',
                              marginRight: '6px'
                            }}>
                              Reusable
                            </span>
                          )}
                          {supply.return_needed && (
                            <span style={{ 
                              backgroundColor: '#ffc107', 
                              color: '#333', 
                              padding: '2px 6px', 
                              borderRadius: '3px',
                              marginRight: '6px'
                            }}>
                              Return Needed
                            </span>
                          )}
                          {supply.link && (
                            <a 
                              href={supply.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#007bff',
                                textDecoration: 'none',
                                marginLeft: '4px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              🔗 Link
                            </a>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => editSupply(index)}
                          style={{
                            backgroundColor: '#ffc107',
                            color: 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginRight: '4px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSupply(index)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ 
                  marginTop: '8px',
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  textAlign: 'right',
                  fontWeight: 'bold'
                }}>
                  Total Supplies Cost: ${getTotalSuppliesCost()}
                </div>
              </>
            )}
          </div>

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

        {/* Location Popup */}
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

              <div style={{ marginTop: '20px' }}>
                {/* <Map
                  longitude={address.longitude}
                  latitude={address.latitude}
                  updateCoordinates={updateCoordinates}
                /> */}
              </div>
              
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

        {/* Supply Popup */}
        {showSupplyPopup && (
            
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
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3>{editingSupplyIndex !== null ? 'Edit Supply' : 'Add Supply'}</h3>
                <button
                  onClick={closeSupplyPopup}
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
              
              <form onSubmit={handleSupplySubmit}>
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Supply Name:
                  <input
                    type="text"
                    name="name"
                    value={currentSupply.name}
                    onChange={handleSupplyChange}
                    required
                    placeholder="e.g., Paper plates, Balloons, etc."
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <label style={{ flex: 1 }}>
                    Quantity:
                    <input
                      type="number"
                      name="quantity"
                      value={currentSupply.quantity}
                      onChange={handleSupplyChange}
                      required
                      min="1"
                      placeholder="0"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </label>
                  
                  <label style={{ flex: 1 }}>
                    Unit Cost ($):
                    <input
                      type="number"
                      name="unitCost"
                      value={currentSupply.unitCost}
                      onChange={handleSupplyChange}
                      required
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </label>
                </div>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Total Cost:
                  <input
                    type="text"
                    value={`$${currentSupply.totalCost}`}
                    readOnly
                    style={{ 
                      width: '100%', 
                      marginTop: '4px',
                      backgroundColor: '#e9ecef',
                      color: '#495057'
                    }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Notes (optional):
                  <textarea
                    name="notes"
                    value={currentSupply.notes}
                    onChange={handleSupplyChange}
                    rows={3}
                    placeholder="Additional details about this supply..."
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Link (optional):
                  <input
                    type="url"
                    name="link"
                    value={currentSupply.link}
                    onChange={handleSupplyChange}
                    placeholder="https://example.com/product-link"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                {/* Vendor Section */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Vendor (optional):</label>
                  {currentSupply.vendor ? (
                    <div style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      padding: '10px',
                      backgroundColor: '#f8f9fa',
                      fontSize: '14px'
                    }}>
                      <strong>{currentSupply.vendor.company}</strong>
                      <div style={{ color: '#666', marginTop: '4px' }}>
                        Contact: {currentSupply.vendor.contact_name}
                      </div>
                      {currentSupply.vendor.contact_email && (
                        <div style={{ color: '#666' }}>
                          Email: {currentSupply.vendor.contact_email}
                        </div>
                      )}
                      {currentSupply.vendor.notes && (
                        <div style={{ color: '#666' }}>
                          Notes: {currentSupply.vendor.notes}
                        </div>
                      )}
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={openVendorPopup}
                          style={{
                            backgroundColor: '#ffc107',
                            color: 'white',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={removeVendor}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openVendorPopup}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      + Add Vendor
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="reusable"
                      checked={currentSupply.reusable}
                      onChange={handleSupplyChange}
                      style={{ marginRight: '8px' }}
                    />
                    Reusable
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="return_needed"
                      checked={currentSupply.return_needed}
                      onChange={handleSupplyChange}
                      style={{ marginRight: '8px' }}
                    />
                    Return Needed
                  </label>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={closeSupplyPopup}
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
                    type="submit"
                    style={{
                      backgroundColor: '#ff8937',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {editingSupplyIndex !== null ? 'Update Supply' : 'Add Supply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vendor Popup */}
        {showVendorPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '450px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3>Vendor Information</h3>
                <button
                  onClick={closeVendorPopup}
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
              
              <form onSubmit={handleVendorSubmit}>
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Company Name:
                  <input
                    type="text"
                    name="company"
                    value={currentVendor.company}
                    onChange={handleVendorChange}
                    required
                    placeholder="Vendor company name"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Contact Name:
                  <input
                    type="text"
                    name="contact_name"
                    value={currentVendor.contact_name}
                    onChange={handleVendorChange}
                    placeholder="Contact person's name"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Contact Address:
                  <input
                    type="text"
                    name="contact_address"
                    value={currentVendor.contact_address}
                    onChange={handleVendorChange}
                    placeholder="Vendor address"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Contact Email:
                  <input
                    type="email"
                    name="contact_email"
                    value={currentVendor.contact_email}
                    onChange={handleVendorChange}
                    placeholder="vendor@example.com"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <label style={{ display: 'block', marginBottom: '20px' }}>
                  Contact Phone:
                  <input
                    type="tel"
                    name="contact_phone"
                    value={currentVendor.contact_phone}
                    onChange={handleVendorChange}
                    placeholder="(123) 456-7890"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                {/* <label style={{ display: 'block', marginBottom: '20px' }}>
                  Notes:
                  <input
                    type="description"
                    name="notes"
                    value={currentVendor.notes}
                    onChange={handleVendorChange}
                    placeholder="Any additional information"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label> */}
                <label style={{ display: 'block', marginBottom: '12px' }}>
                  Notes (optional):
                  <textarea
                    name="notes"
                    value={currentVendor.notes}
                    onChange={handleVendorChange}
                    rows={3}
                    placeholder="Additional details about this vendor..."
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={closeVendorPopup}
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
                    type="submit"
                    style={{
                      backgroundColor: '#ff8937',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Vendor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreateEvent;
