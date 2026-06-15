import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, PackagePlus } from 'lucide-react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function blankSupply() {
  return {
    name: '',
    quantity: '',
    unitCost: '',
    notes: '',
    link: '',
    reusable: false,
    return_needed: false,
    vendor: {
      company: '',
      contact_name: '',
      contact_address: '',
      contact_email: '',
      contact_phone: '',
    },
  };
}

function blankContact() {
  return { computingId: '', contactRole: '', isPrimary: false, editingId: '' };
}

function blankAdvertisement() {
  return {
    platform: '',
    advertisementType: '',
    contentLink: '',
    scheduledPostDate: '',
    actualPostDate: '',
    status: 'planned',
    editingId: '',
  };
}

function blankDocument() {
  return { documentName: '', documentType: '', file: null, editingId: '' };
}

function blankExpense() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    vendorId: '',
    amount: '',
    expenseDate: today,
    category: '',
    description: '',
    editingId: '',
  };
}

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

function display(value) {
  if (value === null || value === undefined) return 'N/A';
  const text = String(value).trim();
  return text || 'N/A';
}

function eventId(event) {
  return event.id || event.event_id;
}

function isLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

function canManageEvent(user, event) {
  if (!user || !event) return false;

  const councilYearId = Number(event.council_year_id ?? event.councilYearId);
  const committeeId = Number(event.committee_id ?? event.committeeId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === committeeId && isLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
}

function formatDate(value) {
  if (!value) return 'Date TBD';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function inputDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function formatTime(value) {
  if (!value) return 'Time TBD';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return display(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function supplyTotal(supply) {
  if (supply.totalCost !== undefined && supply.totalCost !== null) {
    return Number(supply.totalCost) || 0;
  }
  return (Number(supply.quantity) || 0) * (Number(supply.unitCost ?? supply.cost) || 0);
}

export default function ManageEvents() {
  const [user, setUser] = useState(() => readStoredUser());
  const [events, setEvents] = useState([]);
  const [supplies, setSupplies] = useState({});
  const [expenses, setExpenses] = useState({});
  const [showForm, setShowForm] = useState({});
  const [supplyForm, setSupplyForm] = useState({});
  const [contactForm, setContactForm] = useState({});
  const [adForm, setAdForm] = useState({});
  const [documentForm, setDocumentForm] = useState({});
  const [expenseForm, setExpenseForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingKey, setPendingKey] = useState('');

  const fetchSupplies = async id => {
    try {
      const res = await fetch(`${API_BASE}/api/items?event_id=${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || `Items request failed ${res.status}`);
      setSupplies(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
    } catch {
      setSupplies(prev => ({ ...prev, [id]: [] }));
    }
  };

  const fetchExpenses = async id => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}/expenses`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || `Expenses request failed ${res.status}`);
      setExpenses(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
    } catch {
      setExpenses(prev => ({ ...prev, [id]: [] }));
    }
  };

  const fetchEvents = useCallback(async () => {
    const authHeaders = getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/events?limit=100&order=asc`, {
      headers: { Accept: 'application/json', ...authHeaders },
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.message || `Events request failed ${res.status}`);
    const rows = Array.isArray(data) ? data : [];
    setEvents(rows);
    await Promise.all(rows.map(evt => Promise.all([
      fetchSupplies(eventId(evt)),
      fetchExpenses(eventId(evt)),
    ])));
    return rows;
  }, []);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError('');

      try {
        const authHeaders = getAuthHeaders();
        const [, profileRes] = await Promise.all([
          fetchEvents(),
          authHeaders.Authorization
            ? fetch(`${API_BASE}/api/profile`, { headers: { Accept: 'application/json', ...authHeaders } })
            : Promise.resolve(null),
        ]);

        if (profileRes) {
          if (!profileRes.ok) throw new Error(`Profile request failed ${profileRes.status}`);
          const profile = await profileRes.json();
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        }

      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [fetchEvents]);

  const handleShowForm = id => {
    setActionError('');
    setShowForm(prev => ({ ...prev, [id]: !prev[id] }));
    setSupplyForm(prev => ({ ...prev, [id]: prev[id] || blankSupply() }));
  };

  const handleFormChange = (id, event, isVendor = false) => {
    const { name, value, type, checked } = event.target;
    setSupplyForm(prev => {
      const current = prev[id] || blankSupply();
      return {
        ...prev,
        [id]: isVendor
          ? { ...current, vendor: { ...current.vendor, [name]: value } }
          : { ...current, [name]: type === 'checkbox' ? checked : value },
      };
    });
  };

  const handleAddSupply = async id => {
    const form = supplyForm[id] || blankSupply();
    setActionError('');

    if (!form.name.trim()) {
      setActionError('Item name is required.');
      return;
    }

    const payload = {
      event_id: id,
      name: form.name.trim(),
      quantity: parseInt(form.quantity, 10) || 0,
      unitCost: parseFloat(form.unitCost) || 0,
      notes: form.notes.trim() || null,
      link: form.link.trim() || null,
      reusable: form.reusable,
      return_needed: form.return_needed,
      vendor: {
        company: form.vendor.company.trim(),
        contact_name: form.vendor.contact_name.trim() || null,
        contact_address: form.vendor.contact_address.trim() || null,
        contact_email: form.vendor.contact_email.trim() || null,
        contact_phone: form.vendor.contact_phone.trim() || null,
      },
    };

    try {
      setPendingKey(`add:${id}`);
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);

      await fetchSupplies(id);
      setShowForm(prev => ({ ...prev, [id]: false }));
      setSupplyForm(prev => ({ ...prev, [id]: blankSupply() }));
    } catch (err) {
      setActionError(err.message || 'Failed to add item');
    } finally {
      setPendingKey('');
    }
  };

  const confirmSpent = async (id, supplyId) => {
    setActionError('');
    const key = `${id}:${supplyId}`;

    try {
      setPendingKey(key);
      const res = await fetch(`${API_BASE}/api/events/${id}/items/${supplyId}/confirm-spent`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      await fetchSupplies(id);
    } catch (err) {
      setActionError(err.message || 'Failed to confirm item spending');
    } finally {
      setPendingKey('');
    }
  };

  const saveContact = async id => {
    const form = contactForm[id] || blankContact();
    if (!form.computingId.trim()) return setActionError('Contact computing ID is required.');
    const method = form.editingId ? 'PUT' : 'POST';
    const url = form.editingId
      ? `${API_BASE}/api/events/${id}/contacts/${encodeURIComponent(form.editingId)}`
      : `${API_BASE}/api/events/${id}/contacts`;
    await saveAsset(url, method, {
      computingId: form.computingId.trim(),
      contactRole: form.contactRole.trim() || null,
      isPrimary: form.isPrimary,
    });
    setContactForm(prev => ({ ...prev, [id]: blankContact() }));
  };

  const editContact = (id, contact) => {
    setContactForm(prev => ({
      ...prev,
      [id]: {
        computingId: contact.computing_id,
        contactRole: contact.contact_role || '',
        isPrimary: Boolean(contact.is_primary),
        editingId: contact.computing_id,
      },
    }));
  };

  const deleteContact = async (id, computingId) => {
    await saveAsset(`${API_BASE}/api/events/${id}/contacts/${encodeURIComponent(computingId)}`, 'DELETE');
  };

  const saveAdvertisement = async id => {
    const form = adForm[id] || blankAdvertisement();
    const method = form.editingId ? 'PUT' : 'POST';
    const url = form.editingId
      ? `${API_BASE}/api/events/${id}/advertisements/${form.editingId}`
      : `${API_BASE}/api/events/${id}/advertisements`;
    await saveAsset(url, method, {
      platform: form.platform.trim() || null,
      advertisementType: form.advertisementType.trim() || null,
      contentLink: form.contentLink.trim() || null,
      scheduledPostDate: form.scheduledPostDate || null,
      actualPostDate: form.actualPostDate || null,
      status: form.status,
    });
    setAdForm(prev => ({ ...prev, [id]: blankAdvertisement() }));
  };

  const editAdvertisement = (id, ad) => {
    setAdForm(prev => ({
      ...prev,
      [id]: {
        platform: ad.platform || '',
        advertisementType: ad.advertisement_type || '',
        contentLink: ad.content_link || '',
        scheduledPostDate: inputDate(ad.scheduled_post_date),
        actualPostDate: inputDate(ad.actual_post_date),
        status: ad.status || 'planned',
        editingId: ad.advertisement_id,
      },
    }));
  };

  const deleteAdvertisement = async (id, adId) => {
    await saveAsset(`${API_BASE}/api/events/${id}/advertisements/${adId}`, 'DELETE');
  };

  const uploadDocument = async (id, form) => {
    const uploadRes = await fetch(`${API_BASE}/api/events/${id}/documents/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ filename: form.file.name, contentType: form.file.type, size: form.file.size }),
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadData.message || `Upload URL failed ${uploadRes.status}`);
    const s3Res = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': form.file.type },
      body: form.file,
    });
    if (!s3Res.ok) throw new Error(`S3 upload failed ${s3Res.status}`);
    return uploadData.key;
  };

  const saveDocument = async id => {
    const form = documentForm[id] || blankDocument();
    if (!form.documentName.trim()) return setActionError('Document name is required.');
    if (form.editingId) {
      await saveAsset(`${API_BASE}/api/events/${id}/documents/${form.editingId}`, 'PUT', {
        documentName: form.documentName.trim(),
        documentType: form.documentType.trim() || null,
      });
    } else {
      if (!form.file) return setActionError('Document file is required.');
      const key = await uploadDocument(id, form);
      await saveAsset(`${API_BASE}/api/events/${id}/documents`, 'POST', {
        documentName: form.documentName.trim(),
        documentType: form.documentType.trim() || form.file.type,
        key,
      });
    }
    setDocumentForm(prev => ({ ...prev, [id]: blankDocument() }));
  };

  const editDocument = (id, document) => {
    setDocumentForm(prev => ({
      ...prev,
      [id]: {
        documentName: document.document_name || '',
        documentType: document.document_type || '',
        file: null,
        editingId: document.document_id,
      },
    }));
  };

  const deleteDocument = async (id, documentId) => {
    await saveAsset(`${API_BASE}/api/events/${id}/documents/${documentId}`, 'DELETE');
  };

  const openDocument = async (id, documentId) => {
    const res = await fetch(`${API_BASE}/api/events/${id}/documents/${documentId}/download-url`, {
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Download failed ${res.status}`);
    window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const uploadReceipt = async (id, expenseId, file) => {
    const uploadRes = await fetch(`${API_BASE}/api/events/${id}/expenses/${expenseId}/receipt/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadData.message || `Receipt upload URL failed ${uploadRes.status}`);
    const s3Res = await fetch(uploadData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!s3Res.ok) throw new Error(`S3 upload failed ${s3Res.status}`);
    await saveAsset(`${API_BASE}/api/events/${id}/expenses/${expenseId}/receipt`, 'PUT', { key: uploadData.key });
  };

  const openReceipt = async (id, expenseId) => {
    const res = await fetch(`${API_BASE}/api/events/${id}/expenses/${expenseId}/receipt/download-url`, {
      headers: { Accept: 'application/json', ...getAuthHeaders() },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Receipt failed ${res.status}`);
    window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const deleteReceipt = async (id, expenseId) => {
    await saveAsset(`${API_BASE}/api/events/${id}/expenses/${expenseId}/receipt`, 'DELETE');
  };

  const saveExpense = async id => {
    const form = expenseForm[id] || blankExpense();
    if (!form.amount || !form.expenseDate) {
      setActionError('Expense amount and date are required.');
      return;
    }

    const method = form.editingId ? 'PUT' : 'POST';
    const url = form.editingId
      ? `${API_BASE}/api/events/${id}/expenses/${form.editingId}`
      : `${API_BASE}/api/events/${id}/expenses`;
    await saveAsset(url, method, {
      vendorId: form.vendorId || null,
      amount: Number(form.amount) || 0,
      expenseDate: form.expenseDate,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
    });
    setExpenseForm(prev => ({ ...prev, [id]: blankExpense() }));
  };

  const editExpense = (id, expense) => {
    setExpenseForm(prev => ({
      ...prev,
      [id]: {
        vendorId: expense.vendor_id || '',
        amount: expense.amount == null ? '' : String(expense.amount),
        expenseDate: inputDate(expense.expense_date),
        category: expense.category || '',
        description: expense.description || '',
        editingId: expense.expense_id,
      },
    }));
  };

  const deleteExpense = async (id, expenseId) => {
    await saveAsset(`${API_BASE}/api/events/${id}/expenses/${expenseId}`, 'DELETE');
  };

  const saveAsset = async (url, method, body) => {
    setActionError('');
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...getAuthHeaders(),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      await fetchEvents();
      return data;
    } catch (err) {
      setActionError(err.message || 'Action failed');
      throw err;
    }
  };

  if (loading) return <Layout><p style={styles.statusText}>Loading events...</p></Layout>;

  return (
    <Layout>
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Manage Event Items</h1>
            <p style={styles.subhead}>Add supply needs and mark item money as spent once purchases are made.</p>
          </div>
        </header>

        {error && <p style={styles.errorText}>Error: {error}</p>}
        {actionError && <p style={styles.errorText}>Error: {actionError}</p>}

        {!error && (
          <section style={styles.eventList}>
            {!events.length && (
              <article style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>No events found</h2>
                <p style={styles.bodyText}>Create an event before adding items.</p>
              </article>
            )}

            {events.map(evt => {
              const id = eventId(evt);
              const form = supplyForm[id] || blankSupply();
              const list = supplies[id] || [];
              const expenseList = expenses[id] || [];
              const canManage = canManageEvent(user, evt);

              return (
                <article key={id} style={styles.eventCard}>
                  <div style={styles.eventHeader}>
                    <div>
                      <h2 style={styles.eventTitle}>{display(evt.name || evt.title)}</h2>
                      <p style={styles.eventMeta}>
                        {formatDate(evt.event_date)} at {formatTime(evt.event_time)}
                      </p>
                    </div>
                    <div style={styles.eventFacts}>
                      <span style={styles.factPill}>{display(evt.committee_name)}</span>
                      <span style={styles.factPill}>{formatCurrency(evt.budget_allocated)}</span>
                      <span style={styles.factPill}>{display(evt.status).replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <section style={styles.suppliesSection}>
                    <div style={styles.sectionHeader}>
                      <h3 style={styles.sectionTitle}>Items</h3>
                      {canManage && (
                        <button type="button" onClick={() => handleShowForm(id)} style={styles.secondaryButton}>
                          <PackagePlus size={17} />
                          {showForm[id] ? 'Cancel' : 'Add Item'}
                        </button>
                      )}
                    </div>

                    {!canManage && (
                      <p style={styles.permissionText}>
                        Only committee leads and executive board members can update this event.
                      </p>
                    )}

                    {!list.length && <p style={styles.bodyText}>No items have been added.</p>}

                    {Boolean(list.length) && (
                      <div style={styles.itemList}>
                        {list.map(item => {
                          const total = supplyTotal(item);
                          const spent = Boolean(item.spent);
                          const itemKey = `${id}:${item.id}`;

                          return (
                            <article key={item.id} style={styles.itemRow}>
                              <div>
                                <h4 style={styles.itemTitle}>{display(item.name)}</h4>
                                <p style={styles.itemMeta}>
                                  Qty {Number(item.quantity) || 0} at {formatCurrency(item.unitCost ?? item.cost)} each
                                </p>
                                <div style={styles.badgeRow}>
                                  {item.reusable && <span style={styles.badge}>Reusable</span>}
                                  {item.return_needed && <span style={styles.badge}>Return Needed</span>}
                                  {item.link && (
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={styles.itemLink}>
                                      Link
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div style={styles.itemAside}>
                                <strong style={styles.itemTotal}>{formatCurrency(total)}</strong>
                                <span style={styles.vendorText}>Vendor: {display(item.vendor?.company)}</span>
                                {spent ? (
                                  <>
                                    <span style={styles.spentBadge}>
                                      <CheckCircle2 size={16} />
                                      Spent {formatCurrency(item.spentAmount ?? total)}
                                    </span>
                                    {canManage && item.expenseId && (
                                      <div style={styles.inlineActions}>
                                        <label style={styles.smallButton}>
                                          {item.receiptUrl ? 'Replace Receipt' : 'Add Receipt'}
                                          <input
                                            type="file"
                                            accept="application/pdf,image/png,image/jpeg,image/webp"
                                            onChange={event => {
                                              const file = event.target.files?.[0];
                                              if (file) uploadReceipt(id, item.expenseId, file).catch(() => {});
                                              event.target.value = '';
                                            }}
                                            style={styles.fileInput}
                                          />
                                        </label>
                                        {item.receiptUrl && (
                                          <>
                                            <button type="button" onClick={() => openReceipt(id, item.expenseId).catch(err => setActionError(err.message))} style={styles.smallButton}>Open</button>
                                            <button type="button" onClick={() => deleteReceipt(id, item.expenseId).catch(() => {})} style={styles.dangerSmallButton}>Remove</button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : canManage ? (
                                  <button
                                    type="button"
                                    onClick={() => confirmSpent(id, item.id)}
                                    disabled={pendingKey === itemKey}
                                    style={styles.confirmButton}
                                  >
                                    <CheckCircle2 size={16} />
                                    {pendingKey === itemKey ? 'Confirming...' : 'Confirm Spent'}
                                  </button>
                                ) : null}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {canManage && (
                    <section style={styles.assetGrid}>
                      <div style={styles.assetPanelWide}>
                        <h3 style={styles.sectionTitle}>Expenses</h3>
                        {expenseList.map(expense => (
                          <div key={expense.expense_id} style={styles.assetRow}>
                            <span>{formatCurrency(expense.amount)}</span>
                            <span>{formatDate(expense.expense_date)} - {display(expense.category)}</span>
                            <div style={styles.inlineActions}>
                              {expense.receipt_url && <button type="button" onClick={() => openReceipt(id, expense.expense_id).catch(err => setActionError(err.message))} style={styles.smallButton}>Receipt</button>}
                              <label style={styles.smallButton}>
                                {expense.receipt_url ? 'Replace' : 'Upload Receipt'}
                                <input
                                  type="file"
                                  accept="application/pdf,image/png,image/jpeg,image/webp"
                                  onChange={event => {
                                    const file = event.target.files?.[0];
                                    if (file) uploadReceipt(id, expense.expense_id, file).catch(() => {});
                                    event.target.value = '';
                                  }}
                                  style={styles.fileInput}
                                />
                              </label>
                              {expense.receipt_url && <button type="button" onClick={() => deleteReceipt(id, expense.expense_id).catch(() => {})} style={styles.dangerSmallButton}>Remove Receipt</button>}
                              <button type="button" onClick={() => editExpense(id, expense)} style={styles.smallButton}>Edit</button>
                              <button type="button" onClick={() => deleteExpense(id, expense.expense_id).catch(() => {})} style={styles.dangerSmallButton}>Delete</button>
                            </div>
                          </div>
                        ))}
                        <div style={styles.compactForm}>
                          <input placeholder="Vendor ID" value={(expenseForm[id] || blankExpense()).vendorId} onChange={event => setExpenseForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankExpense()), vendorId: event.target.value } }))} style={styles.input} />
                          <input placeholder="Amount" type="number" min="0" step="0.01" value={(expenseForm[id] || blankExpense()).amount} onChange={event => setExpenseForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankExpense()), amount: event.target.value } }))} style={styles.input} />
                          <input type="date" value={(expenseForm[id] || blankExpense()).expenseDate} onChange={event => setExpenseForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankExpense()), expenseDate: event.target.value } }))} style={styles.input} />
                          <input placeholder="Category" value={(expenseForm[id] || blankExpense()).category} onChange={event => setExpenseForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankExpense()), category: event.target.value } }))} style={styles.input} />
                          <input placeholder="Description" value={(expenseForm[id] || blankExpense()).description} onChange={event => setExpenseForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankExpense()), description: event.target.value } }))} style={styles.input} />
                          <button type="button" onClick={() => saveExpense(id).catch(() => {})} style={styles.primaryButton}>{(expenseForm[id] || blankExpense()).editingId ? 'Update Expense' : 'Add Expense'}</button>
                        </div>
                      </div>

                      <div style={styles.assetPanel}>
                        <h3 style={styles.sectionTitle}>Event Contacts</h3>
                        {(evt.contacts || []).map(contact => (
                          <div key={contact.computing_id} style={styles.assetRow}>
                            <span>{display(contact.computing_id)} {contact.is_primary ? '(Primary)' : ''}</span>
                            <span>{display(contact.contact_role)}</span>
                            <div style={styles.inlineActions}>
                              <button type="button" onClick={() => editContact(id, contact)} style={styles.smallButton}>Edit</button>
                              <button type="button" onClick={() => deleteContact(id, contact.computing_id).catch(() => {})} style={styles.dangerSmallButton}>Delete</button>
                            </div>
                          </div>
                        ))}
                        <div style={styles.compactForm}>
                          <input placeholder="Computing ID" value={(contactForm[id] || blankContact()).computingId} onChange={event => setContactForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankContact()), computingId: event.target.value } }))} style={styles.input} />
                          <input placeholder="Role" value={(contactForm[id] || blankContact()).contactRole} onChange={event => setContactForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankContact()), contactRole: event.target.value } }))} style={styles.input} />
                          <label style={styles.checkboxLabel}>
                            <input type="checkbox" checked={(contactForm[id] || blankContact()).isPrimary} onChange={event => setContactForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankContact()), isPrimary: event.target.checked } }))} />
                            Primary
                          </label>
                          <button type="button" onClick={() => saveContact(id).catch(() => {})} style={styles.primaryButton}>{(contactForm[id] || blankContact()).editingId ? 'Update Contact' : 'Add Contact'}</button>
                        </div>
                      </div>

                      <div style={styles.assetPanel}>
                        <h3 style={styles.sectionTitle}>Advertisements</h3>
                        {(evt.advertisements || []).map(ad => (
                          <div key={ad.advertisement_id} style={styles.assetRow}>
                            <span>{display(ad.platform)}</span>
                            <span>{display(ad.advertisement_type)} - {display(ad.status)}</span>
                            <div style={styles.inlineActions}>
                              {ad.content_link && <a href={ad.content_link} target="_blank" rel="noopener noreferrer" style={styles.itemLink}>Open</a>}
                              <button type="button" onClick={() => editAdvertisement(id, ad)} style={styles.smallButton}>Edit</button>
                              <button type="button" onClick={() => deleteAdvertisement(id, ad.advertisement_id).catch(() => {})} style={styles.dangerSmallButton}>Delete</button>
                            </div>
                          </div>
                        ))}
                        <div style={styles.compactForm}>
                          <input placeholder="Platform" value={(adForm[id] || blankAdvertisement()).platform} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), platform: event.target.value } }))} style={styles.input} />
                          <input placeholder="Type" value={(adForm[id] || blankAdvertisement()).advertisementType} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), advertisementType: event.target.value } }))} style={styles.input} />
                          <input placeholder="Content link" value={(adForm[id] || blankAdvertisement()).contentLink} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), contentLink: event.target.value } }))} style={styles.input} />
                          <select value={(adForm[id] || blankAdvertisement()).status} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), status: event.target.value } }))} style={styles.input}>
                            <option value="planned">Planned</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="posted">Posted</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <input type="date" value={(adForm[id] || blankAdvertisement()).scheduledPostDate} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), scheduledPostDate: event.target.value } }))} style={styles.input} />
                          <input type="date" value={(adForm[id] || blankAdvertisement()).actualPostDate} onChange={event => setAdForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankAdvertisement()), actualPostDate: event.target.value } }))} style={styles.input} />
                          <button type="button" onClick={() => saveAdvertisement(id).catch(() => {})} style={styles.primaryButton}>{(adForm[id] || blankAdvertisement()).editingId ? 'Update Ad' : 'Add Ad'}</button>
                        </div>
                      </div>

                      <div style={styles.assetPanelWide}>
                        <h3 style={styles.sectionTitle}>Event Documents</h3>
                        {(evt.documents || []).map(document => (
                          <div key={document.document_id} style={styles.assetRow}>
                            <span>{display(document.document_name)}</span>
                            <span>{display(document.document_type)}</span>
                            <div style={styles.inlineActions}>
                              <button type="button" onClick={() => openDocument(id, document.document_id).catch(err => setActionError(err.message))} style={styles.smallButton}>Open</button>
                              <button type="button" onClick={() => editDocument(id, document)} style={styles.smallButton}>Edit</button>
                              <button type="button" onClick={() => deleteDocument(id, document.document_id).catch(() => {})} style={styles.dangerSmallButton}>Delete</button>
                            </div>
                          </div>
                        ))}
                        <div style={styles.compactForm}>
                          <input placeholder="Document name" value={(documentForm[id] || blankDocument()).documentName} onChange={event => setDocumentForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankDocument()), documentName: event.target.value } }))} style={styles.input} />
                          <input placeholder="Document type" value={(documentForm[id] || blankDocument()).documentType} onChange={event => setDocumentForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankDocument()), documentType: event.target.value } }))} style={styles.input} />
                          {!(documentForm[id] || blankDocument()).editingId && (
                            <input type="file" onChange={event => setDocumentForm(prev => ({ ...prev, [id]: { ...(prev[id] || blankDocument()), file: event.target.files?.[0] || null } }))} style={styles.input} />
                          )}
                          <button type="button" onClick={() => saveDocument(id).catch(() => {})} style={styles.primaryButton}>{(documentForm[id] || blankDocument()).editingId ? 'Update Document' : 'Add Document'}</button>
                        </div>
                      </div>
                    </section>
                  )}

                  {canManage && showForm[id] && (
                    <section style={styles.addForm}>
                      <h3 style={styles.sectionTitle}>Add Item</h3>
                      <div style={styles.formGrid}>
                        <label style={styles.label}>
                          Item Name
                          <input
                            name="name"
                            value={form.name}
                            onChange={event => handleFormChange(id, event)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.label}>
                          Quantity
                          <input
                            name="quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={form.quantity}
                            onChange={event => handleFormChange(id, event)}
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
                            value={form.unitCost}
                            onChange={event => handleFormChange(id, event)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.label}>
                          Item Link
                          <input
                            name="link"
                            value={form.link}
                            onChange={event => handleFormChange(id, event)}
                            style={styles.input}
                          />
                        </label>
                      </div>

                      <label style={styles.label}>
                        Notes
                        <textarea
                          name="notes"
                          rows={3}
                          value={form.notes}
                          onChange={event => handleFormChange(id, event)}
                          style={styles.textarea}
                        />
                      </label>

                      <div style={styles.checkboxRow}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="reusable"
                            checked={form.reusable}
                            onChange={event => handleFormChange(id, event)}
                          />
                          Reusable
                        </label>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            name="return_needed"
                            checked={form.return_needed}
                            onChange={event => handleFormChange(id, event)}
                          />
                          Return needed
                        </label>
                      </div>

                      <h4 style={styles.formSubhead}>Vendor</h4>
                      <div style={styles.formGrid}>
                        <label style={styles.label}>
                          Company
                          <input
                            name="company"
                            value={form.vendor.company}
                            onChange={event => handleFormChange(id, event, true)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.label}>
                          Contact Name
                          <input
                            name="contact_name"
                            value={form.vendor.contact_name}
                            onChange={event => handleFormChange(id, event, true)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.label}>
                          Contact Email
                          <input
                            name="contact_email"
                            type="email"
                            value={form.vendor.contact_email}
                            onChange={event => handleFormChange(id, event, true)}
                            style={styles.input}
                          />
                        </label>
                        <label style={styles.label}>
                          Contact Phone
                          <input
                            name="contact_phone"
                            value={form.vendor.contact_phone}
                            onChange={event => handleFormChange(id, event, true)}
                            style={styles.input}
                          />
                        </label>
                      </div>
                      <label style={styles.label}>
                        Contact Address
                        <input
                          name="contact_address"
                          value={form.vendor.contact_address}
                          onChange={event => handleFormChange(id, event, true)}
                          style={styles.input}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddSupply(id)}
                        disabled={pendingKey === `add:${id}`}
                        style={styles.primaryButton}
                      >
                        {pendingKey === `add:${id}` ? 'Adding...' : 'Add Item'}
                      </button>
                    </section>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: 1180,
    margin: '0 auto',
    color: '#1b365d',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
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
    lineHeight: 1.45,
  },
  eventList: {
    display: 'grid',
    gap: 16,
    marginBottom: 40,
  },
  eventCard: {
    display: 'grid',
    gap: 18,
    padding: 18,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  eventTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 24,
    fontWeight: 800,
  },
  eventMeta: {
    margin: '6px 0 0',
    color: '#667085',
    fontSize: 14,
    fontWeight: 700,
  },
  eventFacts: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  factPill: {
    minHeight: 28,
    padding: '5px 10px',
    borderRadius: 999,
    background: '#eef4ff',
    color: '#003e83',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
  },
  suppliesSection: {
    display: 'grid',
    gap: 12,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 20,
    fontWeight: 800,
  },
  itemList: {
    display: 'grid',
    gap: 10,
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
    padding: 14,
    border: '1px solid #edf0f3',
    borderRadius: 8,
    background: '#f8fafc',
  },
  itemTitle: {
    margin: 0,
    color: '#1b365d',
    fontSize: 17,
    fontWeight: 800,
  },
  itemMeta: {
    margin: '5px 0 0',
    color: '#4d5b6a',
    fontSize: 14,
    fontWeight: 700,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 24,
    padding: '0 8px',
    borderRadius: 999,
    background: '#fff7e6',
    color: '#9a5b00',
    fontSize: 12,
    fontWeight: 800,
  },
  itemLink: {
    color: '#003e83',
    fontSize: 13,
    fontWeight: 800,
  },
  itemAside: {
    display: 'grid',
    justifyItems: 'end',
    gap: 7,
    minWidth: 190,
  },
  itemTotal: {
    color: '#003e83',
    fontSize: 18,
  },
  vendorText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
  },
  spentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    padding: '0 11px',
    borderRadius: 6,
    background: '#ecfdf3',
    color: '#027a48',
    fontSize: 13,
    fontWeight: 800,
  },
  confirmButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 34,
    padding: '0 11px',
    border: '1px solid #b7e4c7',
    borderRadius: 6,
    background: '#fff',
    color: '#027a48',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    padding: '0 13px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 15px',
    border: 'none',
    borderRadius: 6,
    background: '#003e83',
    color: '#fff',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  smallButton: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    padding: '0 9px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    overflow: 'hidden',
  },
  dangerSmallButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    padding: '0 9px',
    border: '1px solid #fecdca',
    borderRadius: 6,
    background: '#fff',
    color: '#b42318',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  inlineActions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  fileInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  assetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 14,
  },
  assetPanel: {
    display: 'grid',
    gap: 10,
    padding: 14,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fbfcfd',
  },
  assetPanelWide: {
    display: 'grid',
    gap: 10,
    padding: 14,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fbfcfd',
    gridColumn: '1 / -1',
  },
  assetRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
    gap: 8,
    alignItems: 'center',
    padding: 10,
    border: '1px solid #edf0f3',
    borderRadius: 6,
    background: '#fff',
    fontSize: 13,
    fontWeight: 700,
  },
  compactForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 8,
    alignItems: 'center',
  },
  addForm: {
    display: 'grid',
    gap: 12,
    padding: 14,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#f8fafc',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 12,
  },
  label: {
    display: 'grid',
    gap: 6,
    color: '#1b365d',
    fontSize: 13,
    fontWeight: 800,
  },
  input: {
    width: '100%',
    minHeight: 40,
    padding: '8px 10px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#1b365d',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: 86,
    padding: '8px 10px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#1b365d',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  checkboxRow: {
    display: 'flex',
    gap: 18,
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: '#1b365d',
    fontWeight: 800,
  },
  formSubhead: {
    margin: '4px 0 0',
    color: '#003e83',
    fontSize: 16,
    fontWeight: 800,
  },
  permissionText: {
    margin: 0,
    color: '#667085',
    fontSize: 13,
    fontWeight: 700,
  },
  emptyState: {
    padding: 24,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
  },
  emptyTitle: {
    margin: '0 0 8px',
    color: '#003e83',
  },
  bodyText: {
    margin: 0,
    color: '#4d5b6a',
  },
  statusText: {
    margin: 0,
    color: '#4d5b6a',
    fontWeight: 700,
  },
  errorText: {
    margin: '0 0 14px',
    color: '#b42318',
    fontWeight: 800,
  },
};
