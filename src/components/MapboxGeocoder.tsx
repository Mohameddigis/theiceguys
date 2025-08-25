import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxGeocoderProps {
  onAddressSelect: (address: string, coordinates: [number, number]) => void;
  placeholder?: string;
}

function MapboxGeocoderComponent({ onAddressSelect, placeholder = "Rechercher une adresse à Marrakech..." }: MapboxGeocoderProps) {
  const geocoderRef = useRef<HTMLDivElement>(null);
  const geocoderInstance = useRef<MapboxGeocoder | null>(null);

  useEffect(() => {
    if (!geocoderRef.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    // Initialize geocoder
    geocoderInstance.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: placeholder,
      bbox: [-8.2, 31.5, -7.8, 31.8], // Bounding box for Marrakech area
      proximity: [-7.9811, 31.6295], // Center on Marrakech
      countries: 'ma', // Restrict to Morocco
      language: 'fr', // French language
      types: 'address,poi', // Address and points of interest
      mapboxgl: mapboxgl
    });

    // Add event listener for result selection
    geocoderInstance.current.on('result', (e) => {
      const result = e.result;
      const address = result.place_name;
      const coordinates = result.center as [number, number];
      onAddressSelect(address, coordinates);
    });

    // Append geocoder to container
    geocoderRef.current.appendChild(geocoderInstance.current.onAdd());

    return () => {
      if (geocoderInstance.current) {
        geocoderInstance.current.onRemove();
      }
    };
  }, [onAddressSelect, placeholder]);

  return (
    <div 
      ref={geocoderRef} 
      className="mapbox-geocoder-container"
      style={{
        '--mapbox-color-text': '#1e293b',
        '--mapbox-color-text-secondary': '#64748b',
        '--mapbox-color-background': '#ffffff',
        '--mapbox-color-background-hover': '#f8fafc',
        '--mapbox-color-border': '#d1d5db',
        '--mapbox-color-border-hover': '#2595c3',
        '--mapbox-color-primary': '#0e7eac'
      } as React.CSSProperties}
    />
  );
}

export default MapboxGeocoderComponent;