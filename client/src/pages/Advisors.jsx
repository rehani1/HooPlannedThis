import React from 'react';
import Layout from '../components/Layout';

const Advisors = () => {
  const earlyAdvisor = [
    {
      id: 1,
      firstName: 'Alice',
      lastName: 'Smith',
      building: 'Gilmer Hall',
      address: '485 McCormick Rd',
      email: 'alice.smith@virginia.edu',
      phone: '(434) 924-1001',
    }
  ];

  const fourthYearAdvisor = [
    {
      id: 2,
      firstName: 'Carmen',
      lastName: 'Nguyen',
      building: 'Rice Hall',
      address: '85 Engineer’s Way',
      email: 'carmen.nguyen@virginia.edu',
      phone: '(434) 924-1004',
    }
  ];

  const renderVerticalTable = (advisor) => (
    <table style={tableStyle}>
      <tbody>
        <tr><th style={labelStyle}>First Name</th><td style={valueStyle}>{advisor.firstName}</td></tr>
        <tr><th style={labelStyle}>Last Name</th><td style={valueStyle}>{advisor.lastName}</td></tr>
        <tr><th style={labelStyle}>Building</th><td style={valueStyle}>{advisor.building}</td></tr>
        <tr><th style={labelStyle}>Address</th><td style={valueStyle}>{advisor.address}</td></tr>
        <tr><th style={labelStyle}>Email</th><td style={valueStyle}><a href={`mailto:${advisor.email}`}>{advisor.email}</a></td></tr>
        <tr><th style={labelStyle}>Phone</th><td style={valueStyle}>{advisor.phone}</td></tr>
      </tbody>
    </table>
  );

  const tableStyle = {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto 2em',
    marginBottom: '2em',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    borderCollapse: 'collapse'
  };

  const labelStyle = {
    backgroundColor: '#f7f7f7',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    width: '180px',
    borderBottom: '1px solid #eee'
  };

  const valueStyle = {
    padding: '12px',
    borderBottom: '1px solid #eee'
  };

  return (
    <Layout>
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px' }}>Advisors</h1>

        <h2 style={{ marginBottom: '12px' }}>Advisor for 1st – 3rd Years</h2>
        {earlyAdvisor.length > 0 ? renderVerticalTable(earlyAdvisor[0]) : <p>No advisor listed.</p>}

        <h2 style={{ marginBottom: '12px' }}>Advisor for 4th Year Trustees</h2>
        {fourthYearAdvisor.length > 0 ? renderVerticalTable(fourthYearAdvisor[0]) : <p>No advisor listed.</p>}
      </div>
    </Layout>
  );
};

export default Advisors;

