const BASE_URL = "https://us1.locationiq.com/v1";
const API_KEY = process.env.LOCATIONIQ_API_KEY;

export const fowardLocation = async (
  q: string,
  city: string,
  postalcode: string
) => {
  const url = `${BASE_URL}/search?key=${API_KEY}&countrycodes=id&city=${city}&q=${q}&postalcode=${postalcode}&format=json&limit=1`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Address must be more spesific");
  }

  const data = await res.json();
  return data[0];
};

export const distanceLocation = async (
  lon1: string | null,
  lat1: string | null,
  lon2: string | null,
  lat2: string | null,
) => {
  const url = `${BASE_URL}/directions/driving/${lon1},${lat1};${lon2},${lat2}?key=${API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Address must be more spesific");
  }

  const data = await res.json();
  return data.routes[0].distance;
};
