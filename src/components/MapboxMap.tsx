import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Target } from 'lucide-react';

interface MapboxMapProps {
  onAddressSelect: (address: string, coordinates: [number, number]) => void;
  selectedCoordinates?: [number, number];
}

function MapboxMap({ onAddressSelect, selectedCoordinates }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-7.9811, 31.6295], // Marrakech center
      zoom: 11,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add delivery zone circle
    map.current.on('load', () => {
      if (!map.current) return;

      // Add circle source for delivery zone
      map.current.addSource('delivery-zone', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-7.9811, 31.6295]
          }
        }
      });

      // Add circle layer (20km radius)
      map.current.addLayer({
        id: 'delivery-zone-circle',
        type: 'circle',
        source: 'delivery-zone',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, 200000] // Approximate 20km at zoom level 20
            ],
            base: 2
          },
          'circle-color': '#0e7eac',
          'circle-opacity': 0.1,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0e7eac',
          'circle-stroke-opacity': 0.5
        }
      });
    });

    // Handle map clicks
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      await handleLocationSelect([lng, lat]);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Update marker when selectedCoordinates change
  useEffect(() => {
    if (selectedCoordinates && map.current) {
      updateMarker(selectedCoordinates);
    }
  }, [selectedCoordinates]);

  const updateMarker = (coordinates: [number, number]) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({
      color: '#0e7eac',
      draggable: true
    })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', async () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        await handleLocationSelect([lngLat.lng, lngLat.lat]);
      }
    });

    // Center map on marker
    map.current.flyTo({
      center: coordinates,
      zoom: 14,
      duration: 1000
    });
  };

  const handleLocationSelect = async (coordinates: [number, number]) => {
    setIsLoading(true);
    
    try {
      // Reverse geocoding to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxgl.accessToken}&language=fr&country=ma`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        onAddressSelect(address, coordinates);
        updateMarker(coordinates);
      } else {
        // Fallback address if geocoding fails
        const fallbackAddress = `Coordonnées: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
        onAddressSelect(fallbackAddress, coordinates);
        updateMarker(coordinates);
      }
    } catch (error) {
      console.error('Erreur lors de la géolocalisation inverse:', error);
      // Fallback address
      const fallbackAddress = `Coordonnées: ${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`;
      onAddressSelect(fallbackAddress, coordinates);
      updateMarker(coordinates);
    } finally {
      setIsLoading(false);
    }
  };

  const centerOnMarrakech = () => {
    if (map.current) {
      map.current.flyTo({
        center: [-7.9811, 31.6295],
        zoom: 11,
        duration: 1000
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          handleLocationSelect(coordinates);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          setIsLoading(false);
          alert('Impossible d\'obtenir votre position. Veuillez cliquer sur la carte pour sélectionner votre adresse.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700">
          Ou cliquez sur la carte pour sélectionner votre adresse
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50"
          >
            <Target className="h-3 w-3" />
            <span>Ma position</span>
          </button>
          <button
            onClick={centerOnMarrakech}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            <MapPin className="h-3 w-3" />
            <span>Marrakech</span>
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-80 rounded-lg border border-slate-300 overflow-hidden"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2 text-brand-primary">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary"></div>
              <span className="text-sm font-medium">Localisation en cours...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-slate-500 space-y-1">
        <p>• Cliquez sur la carte pour sélectionner votre adresse de livraison</p>
        <p>• Le cercle bleu indique notre zone de livraison (20 km autour de Marrakech)</p>
        <p>• Vous pouvez faire glisser le marqueur pour ajuster la position</p>
      </div>
    </div>
  );
}

export default MapboxMap;