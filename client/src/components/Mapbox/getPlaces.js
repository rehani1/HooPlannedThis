import axios from "axios";

export default async function getPlaces(query) {
  try {
    const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
      {
        params: {
            access_token: import.meta.env.VITE_TOKEN,
            autocomplete: true,
            types: 'address,poi,place',
            limit: 5,
            language: 'en',             
            proximity: [-78.507980, 38.033558],  // Charlottesville bias
            bbox: [-78.55, 37.95, -78.45, 38.1], // Tight bounding box for UVA
        },
      }
    );
    console.log("Places API response:", response.data);
    return response.data.features;
  } catch (error) {
    console.error("There was an error while fetching places:", error);
    return[];
  }
}