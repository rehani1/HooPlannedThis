import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';


mapboxgl.accessToken = import.meta.env.VITE_TOKEN    // ← from .env


export default function StaticMap({ address, width = 220, height = 180 }) {
  const mapRef = useRef(null);
  const divRef = useRef(null);

  useEffect(() => {
    /* 1️⃣  Forward‑geocode once, then create map */
    const controller = new AbortController();

    (async () => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
                  `${encodeURIComponent(address)}.json?limit=1&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();
      const feature = data.features[0];
      if (!feature) return;                           // nothing found

      const [lng, lat] = feature.center;
      mapRef.current = new mapboxgl.Map({
        container: divRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: 15,
        interactive: false        // read‑only thumbnail
      });

      new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);
    })();

    return () => {
      controller.abort();
      mapRef.current?.remove();
    };
  }, [address]);

  return (
    <div
      ref={divRef}
      style={{
        width,
        height,
        borderRadius: 8,
        overflow: 'hidden',
        border: '2px solid #eee',
        flexShrink: 0
      }}
    />
  );
}
