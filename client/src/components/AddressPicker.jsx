import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AddressForm from '../components/Mapbox/AddressForm'; // adjust path if needed

const defaultAddress = {
  streetAndNumber: '',
  place: '',
  region: '',
  postcode: '',
  country: '',
  latitude: '',
  longitude: '',
};

/**
 * LocationPickerModal – reusable Mapbox‑powered address selector.
 *
 * Props
 *   ▸ isOpen  (Boolean) – show / hide modal
 *   ▸ onClose (Func)    – fires on ✕ or Cancel
 *   ▸ onSelect(Func)    – ({ address, latitude, longitude, raw }) on confirm
 *   ▸ initialAddress    – optional AddressForm‑shaped object
 */
export default function LocationPickerModal({ isOpen, onClose, onSelect, initialAddress = defaultAddress }) {
  const [address, setAddress] = useState(initialAddress);

  // Reset when reopened with a new starting address
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

  // Early return when closed
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* header */}
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Select Location</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">×</button>
        </div>

        {/* address picker */}
        <AddressForm address={address} setAddress={setAddress} onSubmit={handleConfirm} />

        {/* footer */}
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

/* Self‑contained inline styles – feel free to swap for Tailwind / SCSS. */
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2002, // make sure we’re above other modals
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
    zIndex: 2003, // one above the overlay for good measure
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
