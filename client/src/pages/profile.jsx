import React, { useState } from 'react';
import Layout from '../components/Layout';

const Profile = () => {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    grad_year: 2026,
    committee_id: '',
    bio: '',
    email: '',
    photo_url: '', // default image or empty
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated profile:', profile);
    // TODO: send profile to backend
  };

  return (
    <Layout>
      <div style={{ padding: '40px', maxWidth: '850px', margin: '0 auto' }}>
        {/* Top row: photo + name + save button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Profile picture */}
            <div style={{ textAlign: 'center' }}>
            <img
              src={profile.photo_url || 'https://avatar.iran.liara.run/public'}
              alt="Profile"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%', // This makes it circular
                objectFit: 'cover',  // Ensures it doesn’t stretch
                border: '2px solid #ccc'
              }}
            />

            

              <label
                htmlFor="photoUpload"
                style={{
                  display: 'block',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#007bff',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Edit Photo
              </label>
              <input
                id="photoUpload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <h1 style={{ margin: 0 }}>{profile.first_name} {profile.last_name}</h1>
              <p style={{ color: '#666', marginTop: '4px' }}>
                Class of {profile.grad_year} Class Council
              </p>
              <p style={{ fontSize: '14px', color: '#777' }}>
                Update your profile information below.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: '#ff8937',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '20px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Save Changes
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Committee */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Committee Membership</label>
            <select
              name="committee_id"
              value={profile.committee_id}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>Wellness Committee</option>
              <option>Events Committee</option>
              <option>Budget Committee</option>
              {/* Add more if needed */}
            </select>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Write a short bio about yourself..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>School Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="example@virginia.edu"
              style={inputStyle}
            />
          </div>
        </form>
      </div>
    </Layout>
  );
};

// Reusable styles
const labelStyle = {
  fontWeight: 600,
  fontSize: '14px',
  marginBottom: '6px',
  display: 'block',
  color: '#333'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Poppins, sans-serif'
};

export default Profile;