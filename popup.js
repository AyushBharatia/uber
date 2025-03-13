const GOOGLE_API_KEY = ''; // Replace with your actual API key
const ORIGIN = { lat: 43.7489194, lon: -79.7470896 };
const RADIUS_METERS = 750;

// Load used addresses from localStorage (or start with an empty set)
let usedAddresses = new Set(JSON.parse(localStorage.getItem('usedAddresses')) || []);

function saveUsedAddresses() {
  localStorage.setItem('usedAddresses', JSON.stringify(Array.from(usedAddresses)));
}

function getRandomCoordinates() {
  const radiusInDeg = RADIUS_METERS / 111300;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const deltaLat = w * Math.sin(t);
  const deltaLon = w * Math.cos(t);
  const newLat = ORIGIN.lat + deltaLat;
  const newLon = ORIGIN.lon + (deltaLon / Math.cos(ORIGIN.lat * Math.PI / 180));
  return { lat: newLat, lon: newLon };
}

async function getAddressFromCoordinates(lat, lon) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }
    // Exclude certain types of results
    const excludeTypes = ["country", "administrative_area_level", "locality", "sublocality", "neighborhood", "postal_code"];
    
    let chosenResult = data.results.find(res => {
      if (!res.types) return false;
      return res.types.every(type => !excludeTypes.some(exclude => type.includes(exclude)));
    });
    
    if (!chosenResult) {
      chosenResult = data.results[0];
    }
    return chosenResult.formatted_address;
  } catch (err) {
    console.error('Error fetching address:', err);
    return null;
  }
}

async function generateUniqueAddress() {
  // Try up to 10 times to find an unused address
  for (let i = 0; i < 10; i++) {
    const { lat, lon } = getRandomCoordinates();
    // Pause briefly to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
    const address = await getAddressFromCoordinates(lat, lon);
    if (!address || usedAddresses.has(address)) continue;
    // Save the new address so it isn’t repeated
    usedAddresses.add(address);
    saveUsedAddresses();
    return address;
  }
  return null;
}

document.getElementById('generate').addEventListener('click', async () => {
  const resultDiv = document.getElementById('result');
  resultDiv.textContent = 'Generating address...';
  const address = await generateUniqueAddress();
  if (address) {
    resultDiv.textContent = address;
  } else {
    resultDiv.textContent = '⚠️ Could not find an address, please try again.';
  }
});
