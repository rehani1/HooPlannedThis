import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Megaphone, PackagePlus, Pencil, Trash2, UserRound, X } from 'lucide-react';
import Layout from '../components/Layout';
import AutoCompleteInput from '../components/Mapbox/AutoCompleteInput';
import MapboxMap from '../components/Mapbox/Map';
import 'mapbox-gl/dist/mapbox-gl.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EMPTY_EVENT = {
  name: '',
  eventDate: '',
  eventTime: '',
  description: '',
  budgetAllocated: '',
  volunteerSlots: '0',
  committeeId: '',
  status: 'planned',
};

const EMPTY_LOCATION = {
  locationName: '',
  locationAddress: '',
  city: '',
  state: '',
  zipcode: '',
  venueEmail: '',
  venuePhone: '',
};

const DEFAULT_ADDRESS = {
  streetAndNumber: '',
  place: '',
  region: '',
  postcode: '',
  country: '',
  latitude: 38.0356,
  longitude: -78.5034,
};

const EMPTY_ITEM = {
  name: '',
  quantityNeeded: '1',
  unitCost: '',
  notes: '',
  reusable: false,
  returnNeeded: false,
  link: '',
  vendorCompany: '',
  vendorContactName: '',
  vendorContactAddress: '',
  vendorContactEmail: '',
  vendorContactPhone: '',
};

const EMPTY_CONTACT = {
  computingId: '',
  contactRole: '',
  isPrimary: false,
};

const EMPTY_ADVERTISEMENT = {
  platform: '',
  advertisementType: '',
  contentLink: '',
  scheduledPostDate: '',
  actualPostDate: '',
  status: 'planned',
};

const EMPTY_DOCUMENT = {
  documentName: '',
  documentType: '',
  file: null,
};

function readStoredUser() {
  const saved = localStorage.getItem('user');
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (err) {
    console.error('Could not parse user from localStorage', err);
    return null;
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function classLabel(value) {
  const labels = {
    first: 'First-Year Council',
    second: 'Second-Year Council',
    third: 'Third-Year Council',
    trustees: 'Trustees',
  };
  return labels[value] || value || 'Council';
}

function isLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

function buildCommitteeOptions(councils, user) {
  const executiveCouncilIds = new Set(
    (user?.executivePositions || []).map(position => Number(position.councilYearId))
  );
  const membershipByCommittee = new Map(
    (user?.committeeMemberships || []).map(membership => [
      Number(membership.committeeId),
      membership,
    ])
  );

  const accessible = councils.flatMap(council =>
    (council.committeeRecords || []).map(record => {
      const id = Number(record.id);
      const membership = membershipByCommittee.get(id);
      const executiveAccess = executiveCouncilIds.has(Number(council.council_year_id));
      const leadAccess = isLeadRole(membership?.role);

      return {
        id,
        name: record.name,
        council,
        label: `${record.name} - ${classLabel(council.class_name)} (${council.academic_year})`,
        accessible: executiveAccess || leadAccess || Boolean(membership),
      };
    })
  ).filter(option => option.accessible);

  if (accessible.length || user) return accessible;

  return councils.flatMap(council =>
    (council.committeeRecords || []).map(record => ({
      id: Number(record.id),
      name: record.name,
      council,
      label: `${record.name} - ${classLabel(council.class_name)} (${council.academic_year})`,
      accessible: true,
    }))
  );
}

function itemDisplayCost(item) {
  return (Number(item.quantityNeeded || 0) * Number(item.unitCost || 0)).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function ItemModal({ open, initialItem, onClose, onSave }) {
  const [item, setItem] = useState(EMPTY_ITEM);

  useEffect(() => {
    if (open) setItem({ ...EMPTY_ITEM, ...(initialItem || {}) });
  }, [initialItem, open]);

  if (!open) return null;

  const update = event => {
    const { name, value, type, checked } = event.target;
    setItem(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = event => {
    event.preventDefault();
    const name = item.name.trim();
    if (!name) {
      alert('Item name is required');
      return;
    }

    const quantityNeeded = Number(item.quantityNeeded || 0);
    const unitCost = Number(item.unitCost || 0);
    if (!Number.isInteger(quantityNeeded) || quantityNeeded < 0) {
      alert('Quantity needed must be a non-negative whole number');
      return;
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      alert('Unit cost must be a non-negative number');
      return;
    }

    onSave({
      ...item,
      name,
      quantityNeeded: String(quantityNeeded),
      unitCost: String(unitCost),
      notes: item.notes.trim(),
      link: item.link.trim(),
      vendorCompany: item.vendorCompany.trim(),
      vendorContactName: item.vendorContactName.trim(),
      vendorContactAddress: item.vendorContactAddress.trim(),
      vendorContactEmail: item.vendorContactEmail.trim(),
      vendorContactPhone: item.vendorContactPhone.trim(),
    });
  };

  return (
    <>
      <div style={styles.modalBackdrop} onClick={onClose} />
      <form style={styles.modal} onSubmit={save}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{initialItem ? 'Edit Item' : 'Add Item'}</h2>
          <button type="button" onClick={onClose} style={styles.iconButton} aria-label="Close item modal">
            <X size={20} />
          </button>
        </div>

        <div style={styles.formGrid}>
          <label style={styles.label}>
            Item Name *
            <input name="name" value={item.name} onChange={update} required style={styles.input} />
          </label>
          <label style={styles.label}>
            Quantity Needed *
            <input
              name="quantityNeeded"
              type="number"
              min="0"
              step="1"
              value={item.quantityNeeded}
              onChange={update}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Unit Cost
            <input
              name="unitCost"
              type="number"
              min="0"
              step="0.01"
              value={item.unitCost}
              onChange={update}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Product Link
            <input name="link" type="url" value={item.link} onChange={update} style={styles.input} />
          </label>
        </div>

        <label style={styles.label}>
          Notes
          <textarea name="notes" value={item.notes} onChange={update} rows={3} style={styles.textarea} />
        </label>

        <div style={styles.checkboxRow}>
          <label style={styles.checkboxLabel}>
            <input name="reusable" type="checkbox" checked={item.reusable} onChange={update} />
            Reusable
          </label>
          <label style={styles.checkboxLabel}>
            <input name="returnNeeded" type="checkbox" checked={item.returnNeeded} onChange={update} />
            Return needed
          </label>
        </div>

        <h3 style={styles.sectionTitle}>Vendor</h3>
        <div style={styles.formGrid}>
          <label style={styles.label}>
            Vendor Company
            <input name="vendorCompany" value={item.vendorCompany} onChange={update} style={styles.input} />
          </label>
          <label style={styles.label}>
            Contact Name
            <input name="vendorContactName" value={item.vendorContactName} onChange={update} style={styles.input} />
          </label>
          <label style={styles.label}>
            Contact Email
            <input name="vendorContactEmail" type="email" value={item.vendorContactEmail} onChange={update} style={styles.input} />
          </label>
          <label style={styles.label}>
            Contact Phone
            <input name="vendorContactPhone" value={item.vendorContactPhone} onChange={update} style={styles.input} />
          </label>
        </div>
        <label style={styles.label}>
          Contact Address
          <input name="vendorContactAddress" value={item.vendorContactAddress} onChange={update} style={styles.input} />
        </label>

        <div style={styles.modalActions}>
          <button type="button" onClick={onClose} style={styles.secondaryButton}>Cancel</button>
          <button type="submit" style={styles.primaryButton}>{initialItem ? 'Update Item' : 'Add Item'}</button>
        </div>
      </form>
    </>
  );
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const [event, setEvent] = useState(EMPTY_EVENT);
  const [location, setLocation] = useState(EMPTY_LOCATION);
  const [mapAddress, setMapAddress] = useState(DEFAULT_ADDRESS);
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [user, setUser] = useState(() => readStoredUser());
  const [councils, setCouncils] = useState([]);
  const [loadingCommittees, setLoadingCommittees] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  useEffect(() => {
    async function loadCommitteeOptions() {
      setLoadingCommittees(true);
      setError('');

      try {
        const headers = getAuthHeaders();
        const [profileRes, councilsRes] = await Promise.all([
          headers.Authorization
            ? fetch(`${API_BASE}/api/profile`, { headers: { ...headers, Accept: 'application/json' } })
            : Promise.resolve(null),
          fetch(`${API_BASE}/api/councils`, { headers: { Accept: 'application/json' } }),
        ]);

        if (profileRes) {
          if (!profileRes.ok) throw new Error(`Profile request failed ${profileRes.status}`);
          const profile = await profileRes.json();
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        }

        if (!councilsRes.ok) throw new Error(`Council request failed ${councilsRes.status}`);
        setCouncils(await councilsRes.json());
      } catch (err) {
        setError(err.message || 'Failed to load committees');
      } finally {
        setLoadingCommittees(false);
      }
    }

    loadCommitteeOptions();
  }, []);

  const committeeOptions = useMemo(() => buildCommitteeOptions(councils, user), [councils, user]);

  useEffect(() => {
    if (!event.committeeId && committeeOptions.length) {
      setEvent(current => ({ ...current, committeeId: String(committeeOptions[0].id) }));
    }
  }, [committeeOptions, event.committeeId]);

  const updateEvent = e => {
    const { name, value } = e.target;
    setEvent(current => ({ ...current, [name]: value }));
  };

  const updateLocation = e => {
    const { name, value } = e.target;
    setLocation(current => ({ ...current, [name]: value }));
  };

  const setMapAddressAndLocation = address => {
    setMapAddress(current => ({ ...current, ...address }));
    setLocation(current => ({
      ...current,
      locationName: current.locationName || address.streetAndNumber || '',
      locationAddress: address.streetAndNumber || current.locationAddress,
      city: address.place || current.city,
      state: address.region || current.state,
      zipcode: address.postcode || current.zipcode,
    }));
  };

  const updateMapAddressField = (event, stateProperty) => {
    const value = event.target.value;
    setMapAddress(current => ({ ...current, [stateProperty]: value }));

    const locationFields = {
      streetAndNumber: 'locationAddress',
      place: 'city',
      region: 'state',
      postcode: 'zipcode',
    };
    const locationField = locationFields[stateProperty];
    if (locationField) {
      setLocation(current => ({ ...current, [locationField]: value }));
    }
  };

  const resetMapAddress = () => {
    setMapAddress(DEFAULT_ADDRESS);
    setLocation(current => ({
      ...current,
      locationAddress: '',
      city: '',
      state: '',
      zipcode: '',
    }));
  };

  const openAddItem = () => {
    setEditingItemIndex(null);
    setItemModalOpen(true);
  };

  const openEditItem = index => {
    setEditingItemIndex(index);
    setItemModalOpen(true);
  };

  const closeItemModal = () => {
    setItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const saveItem = item => {
    setItems(current =>
      editingItemIndex === null
        ? [...current, item]
        : current.map((existing, index) => index === editingItemIndex ? item : existing)
    );
    closeItemModal();
  };

  const removeItem = index => {
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addContact = () => setContacts(current => [...current, EMPTY_CONTACT]);
  const updateContact = (index, field, value) => {
    setContacts(current => current.map((contact, contactIndex) =>
      contactIndex === index ? { ...contact, [field]: value } : contact
    ));
  };
  const removeContact = index => {
    setContacts(current => current.filter((_, contactIndex) => contactIndex !== index));
  };

  const addAdvertisement = () => setAdvertisements(current => [...current, EMPTY_ADVERTISEMENT]);
  const updateAdvertisement = (index, field, value) => {
    setAdvertisements(current => current.map((advertisement, advertisementIndex) =>
      advertisementIndex === index ? { ...advertisement, [field]: value } : advertisement
    ));
  };
  const removeAdvertisement = index => {
    setAdvertisements(current => current.filter((_, advertisementIndex) => advertisementIndex !== index));
  };

  const addDocument = () => setDocuments(current => [...current, EMPTY_DOCUMENT]);
  const updateDocument = (index, field, value) => {
    setDocuments(current => current.map((document, documentIndex) =>
      documentIndex === index ? { ...document, [field]: value } : document
    ));
  };
  const removeDocument = index => {
    setDocuments(current => current.filter((_, documentIndex) => documentIndex !== index));
  };

  const uploadDocument = async (eventId, document) => {
    const file = document.file;
    const uploadRes = await fetch(`${API_BASE}/api/events/${eventId}/documents/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadData.message || `Upload URL failed: ${uploadRes.status}`);

    const s3Res = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);

    const metadataRes = await fetch(`${API_BASE}/api/events/${eventId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        documentName: document.documentName.trim(),
        documentType: document.documentType.trim() || file.type,
        key: uploadData.key,
      }),
    });

    const metadata = await metadataRes.json().catch(() => ({}));
    if (!metadataRes.ok) throw new Error(metadata.message || `Document save failed: ${metadataRes.status}`);
    return metadata;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!event.name.trim() || !event.eventDate || !event.eventTime || !event.committeeId) {
      setError('Event name, date, time, and committee are required');
      return;
    }

    if (!location.locationName.trim()) {
      setError('Location name is required');
      return;
    }

    const hasPartialDocument = documents.some(document =>
      (document.documentName.trim() || document.file) &&
      (!document.documentName.trim() || !document.file)
    );
    if (hasPartialDocument) {
      setError('Each document needs both a document name and file');
      return;
    }

    const payload = {
      title: event.name.trim(),
      date: event.eventDate,
      startTime: event.eventTime,
      description: event.description.trim() || null,
      budget: Number(event.budgetAllocated) || 0,
      volunteerSlots: parseInt(event.volunteerSlots, 10) || 0,
      committeeId: Number(event.committeeId),
      status: event.status,
      locationName: location.locationName.trim(),
      locationAddress: location.locationAddress.trim() || null,
      city: location.city.trim() || null,
      state: location.state.trim() || null,
      zipcode: location.zipcode.trim() || null,
      venueEmail: location.venueEmail.trim() || null,
      venuePhone: location.venuePhone.trim() || null,
      supplies: items.map(item => ({
        name: item.name,
        quantity: Number(item.quantityNeeded) || 0,
        unitCost: Number(item.unitCost) || 0,
        notes: item.notes || null,
        reusable: item.reusable,
        returnNeeded: item.returnNeeded,
        link: item.link || null,
        vendor: item.vendorCompany
          ? {
              company: item.vendorCompany,
              contactName: item.vendorContactName || null,
              contactAddress: item.vendorContactAddress || null,
              contactEmail: item.vendorContactEmail || null,
              contactPhone: item.vendorContactPhone || null,
            }
          : null,
      })),
      contacts: contacts
        .filter(contact => contact.computingId.trim())
        .map(contact => ({
          computingId: contact.computingId.trim(),
          contactRole: contact.contactRole.trim() || null,
          isPrimary: contact.isPrimary,
        })),
      advertisements: advertisements
        .filter(advertisement =>
          advertisement.platform.trim() ||
          advertisement.advertisementType.trim() ||
          advertisement.contentLink.trim()
        )
        .map(advertisement => ({
          platform: advertisement.platform.trim() || null,
          advertisementType: advertisement.advertisementType.trim() || null,
          contentLink: advertisement.contentLink.trim() || null,
          scheduledPostDate: advertisement.scheduledPostDate || null,
          actualPostDate: advertisement.actualPostDate || null,
          status: advertisement.status,
        })),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Server error: ${res.status}`);

      const eventId = data.id;
      const documentsToUpload = documents.filter(document => document.documentName.trim() && document.file);
      for (const document of documentsToUpload) {
        await uploadDocument(eventId, document);
      }

      navigate('/events', { state: { notice: `Event created with ID ${data.id}` } });
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <main style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Create Event</h1>
            <p style={styles.subhead}>Add the required event details, location, and item needs.</p>
          </div>
          <Link to="/events" style={styles.secondaryLink}>Back to Events</Link>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.errorText}>{error}</p>}

          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>Event Details</h2>
            <div style={styles.formGrid}>
              <label style={styles.label}>
                Event Name *
                <input name="name" value={event.name} onChange={updateEvent} required style={styles.input} />
              </label>
              <label style={styles.label}>
                Committee *
                <select
                  name="committeeId"
                  value={event.committeeId}
                  onChange={updateEvent}
                  required
                  disabled={loadingCommittees || !committeeOptions.length}
                  style={styles.input}
                >
                  <option value="" disabled>
                    {loadingCommittees ? 'Loading committees...' : 'Select committee'}
                  </option>
                  {committeeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label style={styles.label}>
                Event Date *
                <input name="eventDate" type="date" value={event.eventDate} onChange={updateEvent} required style={styles.input} />
              </label>
              <label style={styles.label}>
                Event Time *
                <input name="eventTime" type="time" value={event.eventTime} onChange={updateEvent} required style={styles.input} />
              </label>
              <label style={styles.label}>
                Status *
                <select name="status" value={event.status} onChange={updateEvent} required style={styles.input}>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label style={styles.label}>
                Event Budget
                <input
                  name="budgetAllocated"
                  type="number"
                  min="0"
                  step="0.01"
                  value={event.budgetAllocated}
                  onChange={updateEvent}
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Volunteers Needed
                <input
                  name="volunteerSlots"
                  type="number"
                  min="0"
                  step="1"
                  value={event.volunteerSlots}
                  onChange={updateEvent}
                  style={styles.input}
                />
              </label>
            </div>
            <label style={styles.label}>
              Description
              <textarea name="description" value={event.description} onChange={updateEvent} rows={4} style={styles.textarea} />
            </label>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.sectionTitle}>Location</h2>
            <div style={styles.locationLayout}>
              <div style={styles.locationFields}>
                <div style={styles.locationPrimaryGrid}>
                  <label style={styles.label}>
                    Location Name *
                    <input name="locationName" value={location.locationName} onChange={updateLocation} required style={styles.input} />
                  </label>
                  <label htmlFor="address" style={styles.label}>
                    Address
                    <AutoCompleteInput
                      setAddress={setMapAddressAndLocation}
                      handleManualInputChange={updateMapAddressField}
                      streetAndNumber={mapAddress.streetAndNumber}
                      inputStyle={styles.input}
                    />
                  </label>
                </div>

                <div style={styles.locationCompactGrid}>
                  <label style={styles.label}>
                    City
                    <input name="city" value={location.city} onChange={updateLocation} style={styles.input} />
                  </label>
                  <label style={styles.label}>
                    State
                    <input name="state" value={location.state} onChange={updateLocation} style={styles.input} />
                  </label>
                  <label style={styles.label}>
                    Zipcode
                    <input name="zipcode" value={location.zipcode} onChange={updateLocation} style={styles.input} />
                  </label>
                </div>

                <div style={styles.locationContactGrid}>
                  <label style={styles.label}>
                    Venue Email
                    <input name="venueEmail" type="email" value={location.venueEmail} onChange={updateLocation} style={styles.input} />
                  </label>
                  <label style={styles.label}>
                    Venue Phone
                    <input name="venuePhone" value={location.venuePhone} onChange={updateLocation} style={styles.input} />
                  </label>
                </div>

                <button type="button" onClick={resetMapAddress} style={styles.resetMapButton}>Reset Pin</button>
              </div>

              <div style={styles.mapPanel}>
                <div style={styles.mapWrapper}>
                  <MapboxMap
                    latitude={Number(mapAddress.latitude) || DEFAULT_ADDRESS.latitude}
                    longitude={Number(mapAddress.longitude) || DEFAULT_ADDRESS.longitude}
                    updateCoordinates={setMapAddressAndLocation}
                  />
                </div>
              </div>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Event Contacts</h2>
              <button type="button" onClick={addContact} style={styles.itemButton}>
                <UserRound size={18} />
                Add Contact
              </button>
            </div>

            {contacts.length ? (
              <div style={styles.detailList}>
                {contacts.map((contact, index) => (
                  <article key={`contact-${index}`} style={styles.detailCard}>
                    <div style={styles.formGrid}>
                      <label style={styles.label}>
                        Computing ID *
                        <input
                          value={contact.computingId}
                          onChange={event => updateContact(index, 'computingId', event.target.value)}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Contact Role
                        <input
                          value={contact.contactRole}
                          onChange={event => updateContact(index, 'contactRole', event.target.value)}
                          placeholder="Planning lead"
                          style={styles.input}
                        />
                      </label>
                    </div>
                    <div style={styles.detailActions}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={contact.isPrimary}
                          onChange={event => updateContact(index, 'isPrimary', event.target.checked)}
                        />
                        Primary contact
                      </label>
                      <button type="button" onClick={() => removeContact(index)} style={styles.iconButton} aria-label="Remove contact">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={styles.bodyText}>No event contacts added yet.</p>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Advertisements</h2>
              <button type="button" onClick={addAdvertisement} style={styles.itemButton}>
                <Megaphone size={18} />
                Add Advertisement
              </button>
            </div>

            {advertisements.length ? (
              <div style={styles.detailList}>
                {advertisements.map((advertisement, index) => (
                  <article key={`advertisement-${index}`} style={styles.detailCard}>
                    <div style={styles.formGrid}>
                      <label style={styles.label}>
                        Platform
                        <input
                          value={advertisement.platform}
                          onChange={event => updateAdvertisement(index, 'platform', event.target.value)}
                          placeholder="Instagram"
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Type
                        <input
                          value={advertisement.advertisementType}
                          onChange={event => updateAdvertisement(index, 'advertisementType', event.target.value)}
                          placeholder="Story post"
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Status
                        <select
                          value={advertisement.status}
                          onChange={event => updateAdvertisement(index, 'status', event.target.value)}
                          style={styles.input}
                        >
                          <option value="planned">Planned</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="posted">Posted</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </label>
                      <label style={styles.label}>
                        Scheduled Post Date
                        <input
                          type="date"
                          value={advertisement.scheduledPostDate}
                          onChange={event => updateAdvertisement(index, 'scheduledPostDate', event.target.value)}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Actual Post Date
                        <input
                          type="date"
                          value={advertisement.actualPostDate}
                          onChange={event => updateAdvertisement(index, 'actualPostDate', event.target.value)}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.labelWide}>
                        Content Link
                        <input
                          type="url"
                          value={advertisement.contentLink}
                          onChange={event => updateAdvertisement(index, 'contentLink', event.target.value)}
                          style={styles.input}
                        />
                      </label>
                    </div>
                    <div style={styles.detailActions}>
                      <button type="button" onClick={() => removeAdvertisement(index)} style={styles.iconButton} aria-label="Remove advertisement">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={styles.bodyText}>No advertisements added yet.</p>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Event Documents</h2>
              <button type="button" onClick={addDocument} style={styles.itemButton}>
                <FileText size={18} />
                Add Document
              </button>
            </div>

            {documents.length ? (
              <div style={styles.detailList}>
                {documents.map((document, index) => (
                  <article key={`document-${index}`} style={styles.detailCard}>
                    <div style={styles.formGrid}>
                      <label style={styles.label}>
                        Document Name *
                        <input
                          value={document.documentName}
                          onChange={event => updateDocument(index, 'documentName', event.target.value)}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Document Type
                        <input
                          value={document.documentType}
                          onChange={event => updateDocument(index, 'documentType', event.target.value)}
                          placeholder="Receipt, flyer, contract"
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.labelWide}>
                        File *
                        <input
                          type="file"
                          onChange={event => updateDocument(index, 'file', event.target.files?.[0] || null)}
                          style={styles.input}
                        />
                      </label>
                    </div>
                    <div style={styles.detailActions}>
                      <button type="button" onClick={() => removeDocument(index)} style={styles.iconButton} aria-label="Remove document">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={styles.bodyText}>No documents added yet.</p>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.sectionTitle}>Items</h2>
              <button type="button" onClick={openAddItem} style={styles.itemButton}>
                <PackagePlus size={18} />
                Add Item
              </button>
            </div>

            {items.length ? (
              <div style={styles.itemList}>
                {items.map((item, index) => (
                  <article key={`${item.name}-${index}`} style={styles.itemCard}>
                    <div>
                      <h3 style={styles.itemTitle}>{item.name}</h3>
                      <p style={styles.itemMeta}>
                        Qty {item.quantityNeeded} at {Number(item.unitCost || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} each
                      </p>
                      <p style={styles.itemMeta}>Estimated total: {itemDisplayCost(item)}</p>
                      {item.vendorCompany && <p style={styles.itemMeta}>Vendor: {item.vendorCompany}</p>}
                    </div>
                    <div style={styles.itemActions}>
                      <button type="button" onClick={() => openEditItem(index)} style={styles.iconButton} aria-label={`Edit ${item.name}`}>
                        <Pencil size={18} />
                      </button>
                      <button type="button" onClick={() => removeItem(index)} style={styles.iconButton} aria-label={`Remove ${item.name}`}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p style={styles.bodyText}>No items added yet.</p>
            )}
          </section>

          <div style={styles.footerActions}>
            <Link to="/events" style={styles.cancelLink}>Cancel</Link>
            <button type="submit" disabled={isSubmitting || loadingCommittees || !committeeOptions.length} style={styles.submitButton}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>

        <ItemModal
          open={itemModalOpen}
          initialItem={editingItemIndex === null ? null : items[editingItemIndex]}
          onClose={closeItemModal}
          onSave={saveItem}
        />
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: 1040,
    margin: '0 auto',
    color: '#1b365d',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  h1: {
    margin: 0,
    color: '#003e83',
    fontSize: 36,
    fontWeight: 800,
  },
  subhead: {
    margin: '8px 0 0',
    color: '#4d5b6a',
  },
  form: {
    display: 'grid',
    gap: 20,
  },
  panel: {
    background: '#fff',
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sectionTitle: {
    margin: '0 0 16px',
    color: '#003e83',
    fontSize: 22,
    fontWeight: 700,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  locationLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  locationFields: {
    display: 'grid',
    gap: 14,
    minWidth: 0,
  },
  locationPrimaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 14,
  },
  locationCompactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 14,
  },
  locationContactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  mapPanel: {
    minWidth: 0,
    height: '100%',
  },
  mapWrapper: {
    height: 438,
    minHeight: 360,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#f5f7fa',
  },
  label: {
    display: 'grid',
    gap: 6,
    color: '#1b365d',
    fontWeight: 700,
    marginBottom: 0,
  },
  labelWide: {
    display: 'grid',
    gap: 6,
    color: '#1b365d',
    fontWeight: 700,
    marginBottom: 0,
    gridColumn: '1 / -1',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    fontFamily: 'Montserrat, sans-serif',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    fontFamily: 'Montserrat, sans-serif',
    resize: 'vertical',
  },
  resetMapButton: {
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    color: '#003e83',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  itemButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--button-orange)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  itemList: {
    display: 'grid',
    gap: 12,
  },
  detailList: {
    display: 'grid',
    gap: 12,
  },
  detailCard: {
    display: 'grid',
    gap: 14,
    border: '1px solid #edf0f3',
    borderRadius: 8,
    background: '#fbfcfd',
    padding: 16,
  },
  detailActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    border: '1px solid #edf0f3',
    borderRadius: 8,
    background: '#fbfcfd',
    padding: 16,
  },
  itemTitle: {
    margin: 0,
    color: '#1b365d',
    fontSize: 18,
    fontWeight: 700,
  },
  itemMeta: {
    margin: '6px 0 0',
    color: '#667085',
    fontSize: 14,
  },
  itemActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    cursor: 'pointer',
  },
  bodyText: {
    margin: 0,
    color: '#4d5b6a',
    lineHeight: 1.5,
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 40,
  },
  cancelLink: {
    color: '#003e83',
    background: '#fff',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: '11px 18px',
    textDecoration: 'none',
    fontWeight: 700,
  },
  secondaryLink: {
    color: '#003e83',
    textDecoration: 'none',
    fontWeight: 700,
  },
  submitButton: {
    background: '#ff8937',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  errorText: {
    color: '#b42318',
    fontWeight: 700,
    margin: 0,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, .45)',
    zIndex: 2000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(720px, calc(100vw - 32px))',
    maxHeight: '86vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 8,
    padding: 24,
    zIndex: 2001,
    boxShadow: '0 20px 48px rgba(0, 0, 0, .22)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  modalTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 24,
    fontWeight: 700,
  },
  checkboxRow: {
    display: 'flex',
    gap: 18,
    flexWrap: 'wrap',
    margin: '8px 0 18px',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: '#1b365d',
    fontWeight: 700,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 24,
  },
  secondaryButton: {
    background: '#fff',
    color: '#003e83',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  primaryButton: {
    background: 'var(--button-orange)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
};
