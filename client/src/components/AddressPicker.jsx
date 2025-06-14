import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AddressForm from '../components/Mapbox/AddressForm'; 

const defaultAddress = {
  streetAndNumber: '',
  place: '',
  region: '',
  postcode: '',
  country: '',
  latitude: '',
  longitude: '',
};


export default function LocationPickerModal({ isOpen, onClose, onSelect, initialAddress = defaultAddress }) {
  const [address, setAddress] = useState(initialAddress);

  
  useEffect(() => {
    if (isOpen) setAddress(initialAddress);
  }, [isOpen, initialAddress]);

  const handleConfirm = (e) => {
    e?.preventDefault?.();
    if (!address.streetAndNumber) return;

    onSelect({
      address: `${address.streetAndNumber}, ${address.place}, ${address.region} ${address.postcode}, ${address.country}`.trim(),
      latitude: address.latitude,
      longitude: address.longitude,
      raw: address,
    });
    onClose();
  };

  
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {}
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Select Location</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">×</button>
        </div>

        {}
        <AddressForm address={address} setAddress={setAddress} onSubmit={handleConfirm} />

        {}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleConfirm} style={styles.confirmBtn}>Use This Location</button>
        </div>
      </div>
    </div>
  );
}

LocationPickerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  initialAddress: PropTypes.object,
};


const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2002, 
  },
  modal: {
    backgroundColor: '#fff',
    width: 600,
    maxHeight: '80vh',
    borderRadius: 8,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 2003, 
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    marginRight: 10,
  },
  confirmBtn: {
    backgroundColor: '#ff8937',
    color: '#fff',
    padding: '8px 16px',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};
