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
  const [showSupplyPopup, setShowSupplyPopup] = useState(false);
  const [supplies, setSupplies] = useState([]);
  const [currentSupply, setCurrentSupply] = useState({
    name: '',
    quantity: '',
    unitCost: '',
    totalCost: '0.00',
    notes: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      ...formData,
      supplies,
      locationCoordinates: selectedLocation ? {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      } : null
    };
    console.log('Submitted Event:', eventData);
    // TODO: send eventData to your backend using fetch or axios
  };

  const openLocationPopup = () => {
    setShowLocationPopup(true);
    // If we have a selected location, populate the address form with it
    if (selectedLocation) {
      setAddress({
        ...address,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
    }
  };

  const closeLocationPopup = () => {
    setShowLocationPopup(false);
    // Reset address state when closing
    setAddress({
      streetAndNumber: "",
      place: "",
      region: "",
      postcode: "",
      country: "",
      latitude: "",
      longitude: "",
    });
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
      notes: ''
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
      notes: ''
    });
  };

  const handleSupplyChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupply(prev => {
      const updated = { ...prev, [name]: value };
      
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
                height: '200px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <Map
                  longitude={selectedLocation.longitude}
                  latitude={selectedLocation.latitude}
                  updateCoordinates={() => {}} // Read-only map
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
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '4px', 
                padding: '10px',
                backgroundColor: '#f8f9fa'
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
                <div style={{ 
                  marginTop: '10px', 
                  paddingTop: '10px', 
                  borderTop: '2px solid #007bff',
                  textAlign: 'right',
                  fontWeight: 'bold'
                }}>
                  Total Supplies Cost: ${getTotalSuppliesCost()}
                </div>
              </div>
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
                
                <label style={{ display: 'block', marginBottom: '20px' }}>
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
      </div>
    </Layout>
  );
};

export default CreateEvent;
