const fetch = require('node-fetch');

async function getDistanceKm(origen, destino) {
  const apiKey = 'AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places'; // <-- Cambia esto por tu API KEY real
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes[0]) throw new Error('No se encontró ruta');
  const distanciaMetros = data.routes[0].legs[0].distance.value;
  return distanciaMetros / 1000; // Devuelve en kilómetros
}

module.exports = { getDistanceKm };
