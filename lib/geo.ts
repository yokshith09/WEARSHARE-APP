/**
 * WearShare Geodesic & Pincode Distance Engine
 * Computes real driving-approximate distances between postal zones.
 */

export interface Coordinates {
  lat: number;
  lng: number;
  area: string;
}

// Major Bengaluru Pincode Centroid Registry
export const BENGALURU_PINCODES: Record<string, Coordinates> = {
  // Central & Downtown
  "560001": { lat: 12.9716, lng: 77.5946, area: "Lavelle Road / MG Road" },
  "560025": { lat: 12.9667, lng: 77.6083, area: "Richmond Town" },
  "560020": { lat: 12.9856, lng: 77.5768, area: "Seshadripuram" },
  "560002": { lat: 12.9615, lng: 77.5833, area: "City Market / Chickpet" },

  // East & Tech Corridors
  "560038": { lat: 12.9784, lng: 77.6408, area: "Indiranagar" },
  "560008": { lat: 12.9719, lng: 77.6205, area: "Ulsoor / Halasuru" },
  "560075": { lat: 12.9714, lng: 77.6566, area: "Domlur / Old Airport Rd" },
  "560066": { lat: 12.9698, lng: 77.7499, area: "Whitefield" },
  "560037": { lat: 12.9569, lng: 77.7011, area: "Marathahalli" },
  "560048": { lat: 12.9982, lng: 77.6926, area: "Hoodi / Mahadevapura" },

  // South & Startup Hubs
  "560034": { lat: 12.9352, lng: 77.6245, area: "Koramangala" },
  "560102": { lat: 12.9121, lng: 77.6446, area: "HSR Layout" },
  "560076": { lat: 12.9166, lng: 77.6101, area: "BTM Layout" },
  "560041": { lat: 12.9250, lng: 77.5938, area: "Jayanagar" },
  "560078": { lat: 12.9063, lng: 77.5857, area: "JP Nagar" },
  "560100": { lat: 12.8452, lng: 77.6602, area: "Electronic City" },
  "560068": { lat: 12.8997, lng: 77.6224, area: "Bommanahalli" },
  "560029": { lat: 12.9317, lng: 77.6044, area: "Tavarekere" },

  // North
  "560080": { lat: 13.0068, lng: 77.5813, area: "Sadashivnagar" },
  "560003": { lat: 12.9988, lng: 77.5711, area: "Malleshwaram" },
  "560092": { lat: 13.0358, lng: 77.5970, area: "Hebbal" },
  "560024": { lat: 13.0285, lng: 77.5891, area: "RT Nagar" },
  "560064": { lat: 13.1007, lng: 77.5963, area: "Yelahanka" },

  // West
  "560010": { lat: 12.9880, lng: 77.5540, area: "Rajajinagar" },
  "560004": { lat: 12.9421, lng: 77.5753, area: "Basavanagudi" },
  "560040": { lat: 12.9592, lng: 77.5300, area: "Vijayanagar" },
  "560085": { lat: 12.9345, lng: 77.5458, area: "Banashankari" },
};

// Coimbatore Pincode Centroid Registry
export const COIMBATORE_PINCODES: Record<string, Coordinates> = {
  "641001": { lat: 11.0018, lng: 76.9628, area: "Town Hall / Coimbatore" },
  "641002": { lat: 11.0125, lng: 76.9554, area: "RS Puram" },
  "641004": { lat: 11.0289, lng: 77.0012, area: "Peelamedu" },
  "641012": { lat: 11.0183, lng: 76.9725, area: "Gandhipuram" },
  "641018": { lat: 11.0055, lng: 76.9740, area: "Race Course" },
};

export const DEFAULT_BENGALURU_COORDINATE: Coordinates = {
  lat: 12.9716,
  lng: 77.5946,
  area: "Central Bengaluru",
};

export const DEFAULT_COIMBATORE_COORDINATE: Coordinates = {
  lat: 11.0168,
  lng: 76.9558,
  area: "Central Coimbatore",
};

/**
 * Validates whether an input is a valid 6-digit Indian PIN code
 */
export function isValidPincode(pincode?: string | null): boolean {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(String(pincode).trim());
}

/**
 * Resolves coordinates for a pincode with safe fallback for Bengaluru and Coimbatore
 */
export function getCoordinatesForPincode(pincode?: string | null): Coordinates {
  if (!pincode) return DEFAULT_BENGALURU_COORDINATE;
  const clean = String(pincode).trim();

  if (BENGALURU_PINCODES[clean]) {
    return BENGALURU_PINCODES[clean];
  }
  if (COIMBATORE_PINCODES[clean]) {
    return COIMBATORE_PINCODES[clean];
  }

  // Region fallback based on prefix
  if (clean.startsWith("641")) {
    return DEFAULT_COIMBATORE_COORDINATE;
  }
  return DEFAULT_BENGALURU_COORDINATE;
}

/**
 * Great-circle distance between two points using the Haversine formula
 * Returns distance in kilometers (with 1.25x road-tortuosity factor)
 */
export function calculateDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  if (coord1.lat === coord2.lat && coord1.lng === coord2.lng) {
    return 0.5; // Within same local sector
  }

  const R = 6371; // Earth radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Approximate real road routing distance (1.25x straight-line urban factor)
  const roadDistanceKm = straightLineKm * 1.25;

  return Math.max(0.5, Math.round(roadDistanceKm * 10) / 10);
}

/**
 * Calculates distance between two Indian pincodes
 */
export function calculatePincodeDistanceKm(
  originPincode?: string | null,
  targetPincode?: string | null
): number | null {
  if (!isValidPincode(originPincode) || !isValidPincode(targetPincode)) {
    return null;
  }
  const origin = getCoordinatesForPincode(originPincode);
  const target = getCoordinatesForPincode(targetPincode);
  return calculateDistanceKm(origin, target);
}
