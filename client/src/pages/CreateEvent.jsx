

import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarIcon from '../components/CalendarIcon';
import CalendarComponent from '../components/CalendarComponent';
import AddressForm from '../components/Mapbox/AddressForm';
import Map from '../components/Mapbox/Map';
import "mapbox-gl/dist/mapbox-gl.css";
 

function CreateEvent(){
    const [address, setAddress] = useState({
        streetAndNumber: "",
        place: "",
        region: "",
        postcode: "",
        country: "",
        latitude: "",
        longitude: "",
      });

    const handleFormSubmit = (event) => {
        event.preventDefault();
        if (address.streetAndNumber) {
          console.log("Selected address:", address);
        }
    };

    const updateCoordinates = (latitude, longitude) => {
        setAddress({ ...address, latitude, longitude });
    };
    
    
    return <div className='CreateEvent'>
        <AddressForm 
            onSubmit={handleFormSubmit} 
            address={address} 
            setAddress={setAddress}
        />
        <Map 
            longitude={address.longitude}
            latitude={address.latitude}
            updateCoordinates={updateCoordinates}
        />

    
    </div>
}
export default CreateEvent;












// const CreateEvent = () => {
//   const [formData, setFormData] = useState({
//     title: '',
//     date: '',
//     location: '',
//     description: ''
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Submitted Event:', formData);
//     // TODO: send formData to your backend using fetch or axios
//   };

//   return (
//     <Layout>
//     <div style={{ padding: '40px' }}>
//       <h1>Create a New Event</h1>
//       <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginTop: '20px' }}>
//         <label>
//           Title:
//           <input
//             type="text"
//             name="title"
//             value={formData.title}
//             onChange={handleChange}
//             required
//             style={{ width: '100%', marginBottom: '12px' }}
//           />
//         </label>
//         <label>
//           Date:
//           <input
//             type="date"
//             name="date"
//             value={formData.date}
//             onChange={handleChange}
//             required
//             style={{ width: '100%', marginBottom: '12px' }}
//           />
//         </label>
//         <label>
//           Location:
//           <input
//             type="text"
//             name="location"
//             value={formData.location}
//             onChange={handleChange}
//             required
//             style={{ width: '100%', marginBottom: '12px' }}
//           />
//         </label>
//         <label>
//           Description:
//           <textarea
//             name="description"
//             value={formData.description}
//             onChange={handleChange}
//             rows={4}
//             style={{ width: '100%', marginBottom: '12px' }}
//           />
//         </label>
//         <button type="submit" style={{
//           backgroundColor: '#ff8937',
//           color: 'white',
//           padding: '10px 20px',
//           border: 'none',
//           borderRadius: '6px',
//           fontWeight: 'bold',
//           cursor: 'pointer'
//         }}>
//           Submit Event
//         </button>
//       </form>
//     </div>
//     </Layout>
//   );
// };

// export default CreateEvent;
