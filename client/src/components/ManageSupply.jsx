import React, { useState, useEffect } from 'react';
import AddressForm from '../components/Mapbox/AddressForm';
import Map from '../components/Mapbox/Map';
import "mapbox-gl/dist/mapbox-gl.css";

export default function ManageSuppliesModal({ isOpen, event, onClose }) {
  // --- Event form state ---
  const [formData, setFormData] = useState({
    title:        '',
    committee:    '',
    date:         '',
    startTime:    '',
    endTime:      '',
    venueName:    '',
    venueContact: '',
    location:     '',
    budget:       '',
    description:  ''
  });
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [selectedLocation, setSelectedLocation]       = useState(null);

  // --- Supplies state ---
  const [supplies, setSupplies]                   = useState([]);
  const [showSupplyPopup, setShowSupplyPopup]     = useState(false);
  const [editingSupplyIndex, setEditingSupplyIndex] = useState(null);
  const [currentSupply, setCurrentSupply]         = useState({
    name: '', quantity: '', unitCost: '', totalCost: '0.00',
    notes: '', link: '', reusable: false, return_needed: false, vendor: null
  });

  // --- Vendor state ---
  const [showVendorPopup, setShowVendorPopup]   = useState(false);
  const [currentVendor, setCurrentVendor]       = useState({
    company: '', contact_name: '', contact_address: '',
    contact_email: '', contact_phone: '', notes: ''
  });

  // Initialize form & fetch supplies when event changes
  useEffect(() => {
    if (!event) return;
    setFormData({
      title:        event.name               || '',
      committee:    event.committee_id       || '',
      date:         event.event_date.slice(0,10) || '',
      startTime:    event.event_time.slice(0,5)  || '',
      endTime:      event.end_time?.slice(0,5)   || '',
      venueName:    event.venue_name          || '',
      venueContact: event.venue_contact       || '',
      location:     event.location_address   || '',
      budget:       event.budget_allocated?.toString() || '',
      description:  event.description         || ''
    });
    setSelectedLocation(event.location_coords || null);

    // fetch supplies
    (async () => {
      try {
        const res = await fetch(`/api/events/${event.event_id}/supplies`, { headers:{ Accept:'application/json' }});
        if (!res.ok) throw new Error(res.statusText);
        setSupplies(await res.json());
      } catch (err) {
        console.error('Could not load supplies', err);
      }
    })();
  }, [event]);

  // --- Event form handlers ---
  const handleEventChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleEventSubmit = async e => {
    e.preventDefault();
    await fetch(`/api/events/${event.event_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:             formData.title,
        committee_id:     formData.committee,
        event_date:       formData.date,
        event_time:       formData.startTime,
        end_time:         formData.endTime,
        venue_name:       formData.venueName,
        venue_contact:    formData.venueContact,
        location_address: formData.location,
        location_coords:  selectedLocation,
        budget_allocated: parseFloat(formData.budget),
        description:      formData.description
      })
    });
    onClose();
  };

  // --- Location popup handlers ---
  const openLocationPopup = () => setShowLocationPopup(true);
  const closeLocationPopup = () => setShowLocationPopup(false);

  const handleAddressSubmit = ({
    streetAndNumber, place, region, postcode, country, latitude, longitude
  }) => {
    const full = `${streetAndNumber}, ${place}, ${region} ${postcode}, ${country}`;
    setFormData(f => ({ ...f, location: full }));
    setSelectedLocation({ latitude, longitude });
    closeLocationPopup();
  };

  // --- Supply management functions ---
  const openSupplyPopup = () => {
    setShowSupplyPopup(true);
    setEditingSupplyIndex(null);
    setCurrentSupply({
      name: '', quantity: '', unitCost: '', totalCost: '0.00',
      notes: '', link: '', reusable: false, return_needed: false, vendor: null
    });
  };

  const closeSupplyPopup = () => {
    setShowSupplyPopup(false);
    setEditingSupplyIndex(null);
    setCurrentSupply({
      name: '', quantity: '', unitCost: '', totalCost: '0.00',
      notes: '', link: '', reusable: false, return_needed: false, vendor: null
    });
  };

  const handleSupplyChange = e => {
    const { name, value, type, checked } = e.target;
    setCurrentSupply(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'quantity' || name === 'unitCost') {
        const qty  = parseFloat(name==='quantity'?value:prev.quantity) || 0;
        const unit = parseFloat(name==='unitCost'?value:prev.unitCost) || 0;
        updated.totalCost = (qty * unit).toFixed(2);
      }
      return updated;
    });
  };

  const handleSupplySubmit = e => {
    e.preventDefault();
    if (!currentSupply.name || !currentSupply.quantity) return;
    if (editingSupplyIndex !== null) {
      const arr = [...supplies];
      arr[editingSupplyIndex] = currentSupply;
      setSupplies(arr);
    } else {
      setSupplies([...supplies, currentSupply]);
    }
    closeSupplyPopup();
  };

  const editSupply = idx => {
    setCurrentSupply(supplies[idx]);
    setEditingSupplyIndex(idx);
    setShowSupplyPopup(true);
  };

  const deleteSupply = idx => {
    setSupplies(supplies.filter((_,i) => i!==idx));
  };

  const getTotalSuppliesCost = () =>
    supplies.reduce((sum,s)=>(sum+parseFloat(s.totalCost||0)),0).toFixed(2);

  // --- Vendor management functions ---
  const openVendorPopup = () => {
    setShowVendorPopup(true);
    if (currentSupply.vendor) setCurrentVendor(currentSupply.vendor);
    else setCurrentVendor({ company:'', contact_name:'', contact_address:'', contact_email:'', contact_phone:'', notes:'' });
  };

  const closeVendorPopup = () => {
    setShowVendorPopup(false);
    setCurrentVendor({ company:'', contact_name:'', contact_address:'', contact_email:'', contact_phone:'', notes:'' });
  };

  const handleVendorChange = e => {
    const { name, value } = e.target;
    setCurrentVendor(v => ({ ...v, [name]: value }));
  };

  const handleVendorSubmit = e => {
    e.preventDefault();
    if (!currentVendor.company) return;
    setCurrentSupply(s => ({ ...s, vendor: currentVendor }));
    closeVendorPopup();
  };

  const removeVendor = () => {
    setCurrentSupply(s => ({ ...s, vendor: null }));
  };

  if (!isOpen || !event) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <header style={styles.header}>
          <h2>Edit “{event.name}”</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </header>

        {/* Event Edit Form */}
        <form onSubmit={handleEventSubmit} style={{marginBottom:20}}>
          {/** Title, Committee, Date, Time, Venue, Location, Budget, Description inputs **/}
          {/* use identical JSX and styling from CreateEvent for these fields */}
          <button type="submit" style={styles.saveEventBtn}>Save Event Details</button>
        </form>

        <hr />

        {/* Supplies Section */}
        <div style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3>Supplies</h3>
            <button onClick={openSupplyPopup} style={styles.addBtn}>+ Add Supply</button>
          </div>
          {supplies.length === 0 ? (
            <p>No supplies added.</p>
          ) : (
            <div style={{marginTop:10}}>
              {supplies.map((s,i)=>(
                <div key={i} style={styles.supplyRow}>
                  <div>
                    <strong>{s.name}</strong><br/>
                    Qty: {s.quantity} × ${s.unitCost} = ${s.totalCost}
                    {s.notes && <div style={styles.notes}>{s.notes}</div>}
                    {s.vendor && <div style={styles.vendorTag}>Vendor: {s.vendor.company}</div>}
                  </div>
                  <div>
                    <button onClick={()=>editSupply(i)} style={styles.editBtn}>Edit</button>
                    <button onClick={()=>deleteSupply(i)} style={styles.delBtn}>Delete</button>
                  </div>
                </div>
              ))}
              <div style={styles.totalCost}>Total: ${getTotalSuppliesCost()}</div>
            </div>
          )}
        </div>

        {/* Supply Popup */}
        {showSupplyPopup && (
          <div style={styles.popupBackdrop}>
            <div style={styles.popupModal}>
              <header style={styles.header}><h3>{editingSupplyIndex!==null?'Edit Supply':'Add Supply'}</h3><button onClick={closeSupplyPopup} style={styles.closeBtn}>×</button></header>
              <form onSubmit={handleSupplySubmit}>
                {/** supply form fields: name, quantity, unitCost, notes, link, reusable, return_needed **/}
                <button type="submit" style={styles.saveBtn}>{editingSupplyIndex!==null?'Update':'Add'}</button>
              </form>
            </div>
          </div>
        )}

        {/* Vendor Popup */}
        {showVendorPopup && (
          <div style={styles.popupBackdrop}>
            <div style={styles.popupModal}>
              <header style={styles.header}><h3>Vendor Information</h3><button onClick={closeVendorPopup} style={styles.closeBtn}>×</button></header>
              <form onSubmit={handleVendorSubmit}>
                {/** vendor form inputs: company, contact_name, etc. **/}
                <button type="submit" style={styles.saveBtn}>Save Vendor</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset:0, background: 'rgba(0,0,0,0.5)',
    display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000
  },
  modal: {
    background:'#fff',borderRadius:8,padding:20,
    width:'90%', maxWidth:600, maxHeight:'85vh',overflowY:'auto'
  },
  header: {
    display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12
  },
  closeBtn: { background:'none',border:'none',fontSize:24,cursor:'pointer' },
  saveEventBtn: { background:'#ff8937',color:'#fff',border:'none',padding:'10px 16px',borderRadius:4,cursor:'pointer' },
  addBtn: { background:'#007bff',color:'#fff',border:'none',padding:'6px 12px',borderRadius:4,cursor:'pointer' },
  supplyRow:{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #e0e0e0' },
  notes:{ fontSize:12,color:'#666',marginTop:4 },
  vendorTag:{ fontSize:12,color:'#555',marginTop:2 },
  editBtn:{ background:'#ffc107',color:'#fff',border:'none',padding:'4px 8px',borderRadius:4,cursor:'pointer',marginRight:4 },
  delBtn:{ background:'#dc3545',color:'#fff',border:'none',padding:'4px 8px',borderRadius:4,cursor:'pointer' },
  totalCost:{ textAlign:'right',fontWeight:'bold',marginTop:8 },
  popupBackdrop:{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100 },
  popupModal:{ background:'#fff',padding:20,borderRadius:8,width:500,maxHeight:'80vh',overflowY:'auto' },
  saveBtn:{ background:'#ff8937',color:'#fff',border:'none',padding:'8px 16px',borderRadius:4,cursor:'pointer',marginTop:12 }
};
