// transit-test.mjs — compare legacy Directions REST vs Routes API v2 for TRANSIT with departure time
const KEY = 'AIzaSyBwcjdAsuPEag_RDmBGgznLWPQlWIYZrhU';
const depUnix = Math.floor(Date.now() / 1000) + 86400;
const depISO = new Date((Math.floor(Date.now() / 1000) + 86400) * 1000).toISOString();

// 1) Legacy Directions REST
const u = new URL('https://maps.googleapis.com/maps/api/directions/json');
u.searchParams.set('origin', 'Sapporo Station');
u.searchParams.set('destination', 'New Otani Inn Sapporo');
u.searchParams.set('mode', 'transit');
u.searchParams.set('departure_time', String(depUnix));
u.searchParams.set('alternatives', 'true');
u.searchParams.set('key', KEY);
const r1 = await fetch(u);
const j1 = await r1.json();
console.log('LEGACY status:', r1.status, 'api:', j1.status, j1.error_message || '');
if (j1.routes) {
  console.log('  routes:', j1.routes.length);
  const leg = j1.routes[0].legs[0];
  console.log('  steps:', leg.steps.length, '| first transit step vehicle:', leg.steps.find(s => s.travel_mode === 'TRANSIT')?.details?.vehicle?.name || '(none)');
}

// 2) Routes API v2
const r2 = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Go-Api-Key': KEY },
  body: JSON.stringify({
    origin: { address: 'Sapporo Station' },
    destination: { address: 'New Otani Inn Sapporo' },
    travelMode: 'TRANSIT',
    computeAlternativeRoutes: true,
    routingPreferences: { departureTime: depISO },
  }),
});
const j2 = await r2.json();
console.log('ROUTESV2 status:', r2.status, j2.error ? JSON.stringify(j2.error).slice(0, 300) : 'ok');
if (j2.routes) {
  console.log('  routes:', j2.routes.length);
  const leg = j2.routes[0].routeLegs?.[0];
  console.log('  leg travelModes:', JSON.stringify(leg?.travelFlag?.staticCodes || leg?.distanceMeters || ''));
  console.log('  first keys:', Object.keys(leg || {}).join(','));
}
