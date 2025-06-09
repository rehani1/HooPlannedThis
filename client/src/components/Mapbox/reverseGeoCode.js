// src/components/Mapbox/reverseGeocode.js
import axios from "axios";

export default async function reverseGeocode(lng, lat) {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
      {
        params: {
          access_token: import.meta.env.VITE_TOKEN,
        },
      }
    );

    const place = response.data.features[0];
    const address = {
      streetAndNumber: "",
      place: "",
      region: "",
      postcode: "",
      country: "",
      latitude: lat,
      longitude: lng,
    };

    if (place) {
      address.streetAndNumber = place.place_name.split(",")[0];

      place.context?.forEach((item) => {
        const id = item.id.split(".")[0];
        address[id] = item.text;
      });
    }

    return address;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
}
