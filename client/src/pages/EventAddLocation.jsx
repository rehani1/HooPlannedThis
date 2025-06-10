// import React, { useState } from 'react';
// import Layout from '../components/Layout';
// import CalendarIcon from '../components/CalendarIcon';
// import CalendarComponent from '../components/CalendarComponent';
// import AddressForm from '../components/Mapbox/AddressForm';
// import Map from '../components/Mapbox/Map';
// import "mapbox-gl/dist/mapbox-gl.css";

// function CreateEvent() {
//   const [address, setAddress] = useState({
//     streetAndNumber: "",
//     place: "",
//     region: "",
//     postcode: "",
//     country: "",
//     latitude: "",
//     longitude: "",
//   });

//   const handleFormSubmit = (event) => {
//     event.preventDefault();
//     if (address.streetAndNumber) {
//       console.log("Selected address:", address);
//     }
//   };

//   const updateCoordinates = (latitude, longitude) => {
//     setAddress({ ...address, latitude, longitude });
//   };

//   return (
//     <Layout>
//       <div className="CreateEvent" style={{ padding: '40px' }}>
//         <h1>Create a New Event</h1>

//         <AddressForm
//           onSubmit={handleFormSubmit}
//           address={address}
//           setAddress={setAddress}
//         />

//         {/* <Map
//           longitude={address.longitude}
//           latitude={address.latitude}
//           updateCoordinates={updateCoordinates}
//         /> */}
//       </div>
//     </Layout>
//   );
// }

// export default CreateEvent;
