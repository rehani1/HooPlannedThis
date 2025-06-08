

import React from 'react';
import Layout from '../components/Layout';
import CalendarIcon from '../components/CalendarIcon';
import CalendarComponent from '../components/CalendarComponent';

const Home = () => {
  return (
    <Layout>
      <h1><CalendarIcon /> Welcome to HooPlannedThis!</h1>
      <p>This is the home page.</p>
      <CalendarComponent/>
    </Layout>
  );
};

export default Home;



