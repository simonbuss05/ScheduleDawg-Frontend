// src/utils/geocoding.js
import { getCachedCoords, setCachedCoords } from './geocodeCache';
import { getBuildingOverride } from './buildingOverrides';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

const UGA_CENTER = { lng: -83.3782, lat: 33.9480 };
const ATHENS_BBOX = '-83.45,33.87,-83.28,34.02';

export async function geocodeAddress(query) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    query
  )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Geocoding request failed');
  }

  const data = await res.json();
  if (!data.features || data.features.length === 0) {
    throw new Error('No results found for that address');
  }

  const [lng, lat] = data.features[0].center;
  return { lat, lng, placeName: data.features[0].place_name };
}

const VAGUE_PLACE_TYPES = ['place', 'region', 'district', 'locality', 'neighborhood'];

async function tryMapboxBuilding(building) {
  const query = `${building}, University of Georgia, Athens, GA`;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}` +
    `&proximity=${UGA_CENTER.lng},${UGA_CENTER.lat}` +
    `&bbox=${ATHENS_BBOX}` +
    `&limit=1`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.features || data.features.length === 0) return null;

  const feature = data.features[0];
  const placeTypes = feature.place_type || [];
  const isVague = placeTypes.every((t) => VAGUE_PLACE_TYPES.includes(t));
  if (isVague) return null;

  const [lng, lat] = feature.center;
  return { lat, lng, placeName: feature.place_name };
}

async function tryNominatim(building) {
  const query = `${building}, University of Georgia, Athens, GA`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=1&viewbox=${ATHENS_BBOX}&bounded=1`;

  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data || data.length === 0) return null;

  const match = data[0];
  return { lat: parseFloat(match.lat), lng: parseFloat(match.lon), placeName: match.display_name };
}

export async function geocodeBuilding(building) {
  const override = getBuildingOverride(building);
  if (override) return override;

  const cacheKey = `building-v4:${building.trim().toLowerCase()}`;
  const cached = getCachedCoords(cacheKey);
  if (cached) return cached;

  let result = await tryMapboxBuilding(building);
  if (!result) result = await tryNominatim(building);

  if (!result) {
    throw new Error(`Could not locate "${building}" — try selecting it from the building suggestions when editing this meeting.`);
  }

  setCachedCoords(cacheKey, result);
  return result;
}