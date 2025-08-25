// Coordonnées du centre de Marrakech
const MARRAKECH_CENTER = {
  lat: 31.6295,
  lng: -7.9811
};

// Rayon de livraison en kilomètres
const DELIVERY_RADIUS_KM = 20;

/**
 * Calcule la distance entre deux points géographiques en utilisant la formule de Haversine
 * @param lat1 Latitude du premier point
 * @param lng1 Longitude du premier point
 * @param lat2 Latitude du deuxième point
 * @param lng2 Longitude du deuxième point
 * @returns Distance en kilomètres
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

/**
 * Vérifie si une adresse est dans le périmètre de livraison
 * @param coordinates Coordonnées [longitude, latitude] de l'adresse
 * @returns Objet avec isInZone (boolean) et distance (number)
 */
export function checkDeliveryZone(coordinates: [number, number]): {
  isInZone: boolean;
  distance: number;
} {
  const [lng, lat] = coordinates;
  const distance = calculateDistance(
    MARRAKECH_CENTER.lat,
    MARRAKECH_CENTER.lng,
    lat,
    lng
  );
  
  return {
    isInZone: distance <= DELIVERY_RADIUS_KM,
    distance: Math.round(distance * 10) / 10 // Arrondi à 1 décimale
  };
}

/**
 * Obtient un message d'erreur personnalisé selon la distance
 * @param distance Distance en kilomètres
 * @returns Message d'erreur approprié
 */
export function getDeliveryZoneMessage(distance: number): string {
  if (distance <= DELIVERY_RADIUS_KM) {
    return `✅ Livraison disponible (${distance} km de Marrakech)`;
  } else {
    const extraDistance = Math.round((distance - DELIVERY_RADIUS_KM) * 10) / 10;
    return `❌ Désolé, cette adresse est en dehors de notre zone de livraison. Vous êtes à ${distance} km de Marrakech (${extraDistance} km au-delà de notre périmètre de 20 km).`;
  }
}