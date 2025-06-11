import React from 'react';
import Layout from '../components/Layout';
import firstToThirdAdvisorpfp from '../components/avatars/firstToThirdAdvisorpfp.jpeg';
import trusteesAdvisorpfp from '../components/avatars/trusteesAdvisorpfp.jpeg';

const Advisors = () => {
  
  const earlyAdvisor = [{
    id: 1,
    firstName: 'Alice',
    lastName:  'Smith',
    building:  'Gilmer Hall',
    address:   '485 McCormick Rd',
    email:     'alice.smith@virginia.edu',
    phone:     '(434) 924‑1001',
    photoUrl:  firstToThirdAdvisorpfp        
  }];

  const fourthYearAdvisor = [{
    id: 2,
    firstName: 'Carmen',
    lastName:  'Nguyen',
    building:  'Rice Hall',
    address:   '85 Engineer’s Way',
    email:     'carmen.nguyen@virginia.edu',
    phone:     '(434) 924‑1004',
    photoUrl:  trusteesAdvisorpfp                           
  }];

  

const cardWrapper = {
    display: 'flex',
    alignItems: 'center',      
    gap: '20px',
    marginBottom: '2em'
  };
  

const avatarStyle = {
    width: 150,
    height: 188,       
    borderRadius: 8,    
    objectFit: 'cover',
    border: '3px solid #eee',
    flexShrink: 0
  };
  
  const tableStyle = {
    width: '100%', maxWidth: 600, borderCollapse: 'collapse',
    background: '#fff', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden'
  };
  const labelStyle = {
    background: '#f7f7f7', fontWeight: 600, width: 180, padding: 12,
    textAlign: 'left', borderBottom: '1px solid #eee'
  };
  const valueStyle = { padding: 12, borderBottom: '1px solid #eee' };

  
  const renderAdvisorCard = (adv) => (
    <div style={cardWrapper}>
      {adv.photoUrl && (
        <img
          src={adv.photoUrl}
          alt={`${adv.firstName} ${adv.lastName}`}
          style={avatarStyle}
        />
      )}

      <table style={tableStyle}>
        <tbody>
          <tr><th style={labelStyle}>First Name</th><td style={valueStyle}>{adv.firstName}</td></tr>
          <tr><th style={labelStyle}>Last Name</th> <td style={valueStyle}>{adv.lastName}</td></tr>
          <tr><th style={labelStyle}>Building</th>  <td style={valueStyle}>{adv.building}</td></tr>
          <tr><th style={labelStyle}>Address</th>   <td style={valueStyle}>{adv.address}</td></tr>
          <tr><th style={labelStyle}>Email</th>     <td style={valueStyle}>
              <a href={`mailto:${adv.email}`}>{adv.email}</a>
          </td></tr>
          <tr><th style={labelStyle}>Phone</th>     <td style={valueStyle}>{adv.phone}</td></tr>
        </tbody>
      </table>
    </div>
  );


  return (
    <Layout>
      <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 24 }}>Advisors</h1>

        <h2 style={{ marginBottom: 12 }}>Advisor for 1st – 3rd Years</h2>
        {earlyAdvisor.length ? renderAdvisorCard(earlyAdvisor[0]) : <p>No advisor listed.</p>}

        <h2 style={{ marginBottom: 12 }}>Advisor for 4th Year Trustees</h2>
        {fourthYearAdvisor.length ? renderAdvisorCard(fourthYearAdvisor[0]) : <p>No advisor listed.</p>}
      </div>
    </Layout>
  );
};

export default Advisors;


