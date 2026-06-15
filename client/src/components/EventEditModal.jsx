import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

const EVENT_STATUSES = ['planned', 'in_progress', 'completed', 'cancelled'];

function display(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function inputDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function inputTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function statusLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function eventField(event, snakeName, camelName) {
  return display(event?.[snakeName] ?? event?.[camelName]);
}

function buildInitialForm(event) {
  return {
    name: display(event?.name),
    committeeId: display(event?.committee_id ?? event?.committeeId),
    eventDate: inputDate(event?.event_date ?? event?.eventDate),
    eventTime: inputTime(event?.event_time ?? event?.eventTime),
    status: display(event?.status || 'planned'),
    budgetAllocated: display(event?.budget_allocated ?? event?.budgetAllocated ?? 0),
    volunteerSlots: display(event?.volunteer_slots ?? event?.volunteerSlots ?? 0),
    description: display(event?.description),
    locationName: eventField(event, 'location_name', 'locationName'),
    locationAddress: eventField(event, 'location_address', 'locationAddress'),
    city: eventField(event, 'location_city', 'locationCity'),
    state: eventField(event, 'location_state', 'locationState'),
    zipcode: eventField(event, 'location_zipcode', 'locationZipcode'),
    venueEmail: eventField(event, 'venue_email', 'venueEmail'),
    venuePhone: eventField(event, 'venue_phone', 'venuePhone'),
  };
}

export default function EventEditModal({
  open,
  event,
  committeeOptions,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => buildInitialForm(event));
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(event));
      setLocalError('');
    }
  }, [event, open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = keyEvent => {
      if (keyEvent.key === 'Escape' && !saving) onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, saving]);

  if (!open) return null;

  const updateField = fieldEvent => {
    const { name, value } = fieldEvent.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const submit = submitEvent => {
    submitEvent.preventDefault();
    setLocalError('');

    if (!form.name.trim() || !form.eventDate || !form.eventTime || !form.committeeId) {
      setLocalError('Event name, committee, date, and time are required.');
      return;
    }

    const hasLocationFields = [
      form.locationName,
      form.locationAddress,
      form.city,
      form.state,
      form.zipcode,
      form.venueEmail,
      form.venuePhone,
    ].some(value => value.trim());

    if (hasLocationFields && !form.locationName.trim()) {
      setLocalError('Location name is required when location details are provided.');
      return;
    }

    onSubmit(form);
  };

  const currentCommitteeId = Number(event?.committee_id ?? event?.committeeId);
  const options = committeeOptions.some(option => Number(option.id) === Number(form.committeeId))
    ? committeeOptions
    : [
        ...committeeOptions,
        {
          id: currentCommitteeId,
          label: event?.committee_name || event?.committeeName || `Committee #${currentCommitteeId}`,
        },
      ].filter(option => Number.isInteger(Number(option.id)) && Number(option.id) > 0);

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="event-edit-title">
      <button
        type="button"
        aria-label="Close edit event modal"
        style={styles.backdrop}
        onClick={saving ? undefined : onClose}
      />
      <form style={styles.modal} onSubmit={submit}>
        <header style={styles.header}>
          <div>
            <h2 id="event-edit-title" style={styles.title}>Edit Event</h2>
            <p style={styles.subtitle}>{event?.name || 'Event'}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} style={styles.iconButton} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <div style={styles.body}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Event Details</h3>
            <div style={styles.grid}>
              <label style={styles.label}>
                Event Name *
                <input name="name" value={form.name} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Committee *
                <select name="committeeId" value={form.committeeId} onChange={updateField} style={styles.input}>
                  <option value="" disabled>Select committee</option>
                  {options.map(option => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Status *
                <select name="status" value={form.status} onChange={updateField} style={styles.input}>
                  {EVENT_STATUSES.map(status => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Date *
                <input name="eventDate" type="date" value={form.eventDate} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Time *
                <input name="eventTime" type="time" value={form.eventTime} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Budget
                <input
                  name="budgetAllocated"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.budgetAllocated}
                  onChange={updateField}
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
                  value={form.volunteerSlots}
                  onChange={updateField}
                  style={styles.input}
                />
              </label>
            </div>

            <label style={styles.label}>
              Description
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={updateField}
                style={styles.textarea}
              />
            </label>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Location</h3>
            <div style={styles.grid}>
              <label style={styles.label}>
                Location Name
                <input name="locationName" value={form.locationName} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.labelWide}>
                Address
                <input name="locationAddress" value={form.locationAddress} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                City
                <input name="city" value={form.city} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                State
                <input name="state" value={form.state} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Zipcode
                <input name="zipcode" value={form.zipcode} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Venue Email
                <input name="venueEmail" type="email" value={form.venueEmail} onChange={updateField} style={styles.input} />
              </label>

              <label style={styles.label}>
                Venue Phone
                <input name="venuePhone" value={form.venuePhone} onChange={updateField} style={styles.input} />
              </label>
            </div>
          </section>
        </div>

        {(localError || error) && <p style={styles.errorText}>{localError || error}</p>}

        <footer style={styles.footer}>
          <button type="button" onClick={onClose} disabled={saving} style={styles.cancelButton}>
            <X size={18} />
            Cancel
          </button>
          <button type="submit" disabled={saving} style={styles.saveButton}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </footer>
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'grid',
    placeItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    border: 0,
    background: 'rgba(15, 23, 42, 0.48)',
    cursor: 'pointer',
  },
  modal: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr) auto auto',
    width: 'min(920px, 100%)',
    maxHeight: 'calc(100vh - 48px)',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    padding: '22px 24px 16px',
    borderBottom: '1px solid #edf0f3',
  },
  title: {
    margin: 0,
    color: '#003e83',
    fontSize: 28,
    fontWeight: 800,
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#667085',
    fontWeight: 700,
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    cursor: 'pointer',
  },
  body: {
    display: 'grid',
    gap: 20,
    padding: 24,
    overflowY: 'auto',
  },
  section: {
    display: 'grid',
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 18,
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 14,
  },
  label: {
    display: 'grid',
    gap: 7,
    color: '#1b365d',
    fontSize: 13,
    fontWeight: 800,
  },
  labelWide: {
    display: 'grid',
    gap: 7,
    color: '#1b365d',
    fontSize: 13,
    fontWeight: 800,
    gridColumn: '1 / -1',
  },
  input: {
    width: '100%',
    minHeight: 42,
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
    minHeight: 104,
    padding: '9px 10px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#1b365d',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  errorText: {
    margin: '0 24px 14px',
    color: '#b42318',
    fontSize: 13,
    fontWeight: 800,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '16px 24px 22px',
    borderTop: '1px solid #edf0f3',
  },
  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    padding: '0 16px',
    border: 'none',
    borderRadius: 6,
    background: '#003e83',
    color: '#fff',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  cancelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    padding: '0 16px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
