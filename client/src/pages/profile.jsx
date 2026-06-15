import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function display(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return display(value);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [photoSrc, setPhotoSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [error, setError] = useState('');

  const loadPhoto = async () => {
    const res = await fetch(`${API_BASE}/api/profile/photo-url`, {
      headers: {
        ...getAuthHeaders(),
        Accept: 'application/json',
      },
    });
    if (res.status === 404) {
      setPhotoSrc('');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Photo request failed ${res.status}`);
    setPhotoSrc(data.downloadUrl);
  };

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          headers: {
            ...getAuthHeaders(),
            Accept: 'application/json',
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `Profile request failed ${res.status}`);
        setProfile(data);
        localStorage.setItem('user', JSON.stringify(data));
        if (data.photoUrl) await loadPhoto();
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const uploadPhoto = async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const uploadRes = await fetch(`${API_BASE}/api/profile/photo/upload-url`, {
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
      if (!uploadRes.ok) throw new Error(uploadData.message || `Upload URL failed ${uploadRes.status}`);

      const s3Res = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 upload failed ${s3Res.status}`);

      const saveRes = await fetch(`${API_BASE}/api/profile/photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ key: uploadData.key }),
      });
      const updated = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) throw new Error(updated.message || `Profile photo save failed ${saveRes.status}`);

      setProfile(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      await loadPhoto();
      setPhotoModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to upload profile photo');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removePhoto = async () => {
    setRemoving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/profile/photo`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          Accept: 'application/json',
        },
      });
      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated.message || `Photo remove failed ${res.status}`);

      setProfile(updated);
      setPhotoSrc('');
      localStorage.setItem('user', JSON.stringify(updated));
      setPhotoModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to remove profile photo');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Layout>
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Profile</h1>
            <p style={styles.subtitle}>Council member information from the ERD.</p>
          </div>
        </header>

        {loading && <p style={styles.statusText}>Loading profile...</p>}
        {error && <p style={styles.errorText}>{error}</p>}

        {!loading && profile && (
          <section style={styles.panel}>
            <div style={styles.photoRow}>
              <button
                type="button"
                onClick={() => setPhotoModalOpen(true)}
                style={styles.photoButton}
                aria-label={photoSrc ? 'Replace or remove profile photo' : 'Add profile photo'}
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="" style={styles.photo} />
                ) : (
                  <span style={styles.photoPlaceholder}>No Photo</span>
                )}
              </button>
            </div>

            <dl style={styles.grid}>
              <div style={styles.field}>
                <dt style={styles.label}>Computing ID</dt>
                <dd style={styles.value}>{display(profile.username || profile.id)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>Council Year ID</dt>
                <dd style={styles.value}>{display(profile.councilYearId)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>First Name</dt>
                <dd style={styles.value}>{display(profile.firstName)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>Last Name</dt>
                <dd style={styles.value}>{display(profile.lastName)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>Email</dt>
                <dd style={styles.value}>{display(profile.email)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>Photo URL</dt>
                <dd style={styles.value}>{display(profile.photoUrl)}</dd>
              </div>
              <div style={styles.fieldWide}>
                <dt style={styles.label}>Bio</dt>
                <dd style={styles.value}>{display(profile.bio)}</dd>
              </div>
              <div style={styles.field}>
                <dt style={styles.label}>Created Account At</dt>
                <dd style={styles.value}>{formatDate(profile.createdAccountAt)}</dd>
              </div>
            </dl>
          </section>
        )}

        {photoModalOpen && (
          <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="profile-photo-title">
            <button
              type="button"
              style={styles.modalBackdrop}
              onClick={() => !uploading && !removing && setPhotoModalOpen(false)}
              aria-label="Close profile photo modal"
            />
            <section style={styles.modal}>
              <header style={styles.modalHeader}>
                <h2 id="profile-photo-title" style={styles.modalTitle}>Profile Photo</h2>
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  disabled={uploading || removing}
                  style={styles.closeButton}
                >
                  Close
                </button>
              </header>

              <div style={styles.modalBody}>
                {photoSrc ? (
                  <img src={photoSrc} alt="" style={styles.modalPhoto} />
                ) : (
                  <div style={styles.modalPhotoPlaceholder}>No Photo</div>
                )}
              </div>

              <footer style={styles.modalActions}>
                <label style={styles.primaryButton}>
                  {uploading ? 'Uploading...' : photoSrc ? 'Replace Photo' : 'Add Photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadPhoto}
                    disabled={uploading || removing}
                    style={styles.fileInput}
                  />
                </label>
                {profile.photoUrl && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={uploading || removing}
                    style={styles.dangerButton}
                  >
                    {removing ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
              </footer>
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: 880,
    margin: '0 auto',
    color: '#1b365d',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    margin: 0,
    color: '#003e83',
    fontSize: 36,
    fontWeight: 800,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#4d5b6a',
  },
  panel: {
    display: 'grid',
    gap: 20,
    background: '#fff',
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 8,
    objectFit: 'cover',
    border: '1px solid #dfe4ea',
  },
  photoButton: {
    display: 'inline-flex',
    width: 96,
    height: 96,
    padding: 0,
    border: 0,
    borderRadius: 8,
    background: 'transparent',
    cursor: 'pointer',
  },
  photoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  photoPlaceholder: {
    display: 'grid',
    placeItems: 'center',
    width: 96,
    height: 96,
    borderRadius: 8,
    border: '1px solid #dfe4ea',
    background: '#f5f7fa',
    color: '#667085',
    fontSize: 12,
    fontWeight: 800,
  },
  primaryButton: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 6,
    background: '#003e83',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  fileInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'grid',
    placeItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    border: 0,
    background: 'rgba(15, 23, 42, 0.48)',
    cursor: 'pointer',
  },
  modal: {
    position: 'relative',
    zIndex: 1,
    width: 'min(420px, 100%)',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '18px 20px',
    borderBottom: '1px solid #edf0f3',
  },
  modalTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 22,
    fontWeight: 800,
  },
  closeButton: {
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    padding: '8px 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalBody: {
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  modalPhoto: {
    width: 180,
    height: 180,
    borderRadius: 8,
    objectFit: 'cover',
    border: '1px solid #dfe4ea',
  },
  modalPhotoPlaceholder: {
    display: 'grid',
    placeItems: 'center',
    width: 180,
    height: 180,
    borderRadius: 8,
    border: '1px solid #dfe4ea',
    background: '#f5f7fa',
    color: '#667085',
    fontWeight: 800,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
    padding: '16px 20px 20px',
    borderTop: '1px solid #edf0f3',
  },
  dangerButton: {
    border: '1px solid #fecdca',
    borderRadius: 6,
    background: '#fff',
    color: '#b42318',
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    margin: 0,
  },
  field: {
    minWidth: 0,
  },
  fieldWide: {
    minWidth: 0,
    gridColumn: '1 / -1',
  },
  label: {
    color: '#667085',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  value: {
    margin: '5px 0 0',
    color: '#1b365d',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  statusText: {
    margin: 0,
    color: '#4d5b6a',
    fontWeight: 700,
  },
  errorText: {
    margin: 0,
    color: '#b42318',
    fontWeight: 800,
  },
};
