const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');

// CONFIGURA ESTOS DATOS:
const GOOGLE_API_KEY = 'AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places'; // <-- PON TU API KEY DE GOOGLE
const rutaId = 2; // Cambia por el id de tu otra ruta
const origen = 'Bucaramanga'; // Cambia por el nuevo origen
const destino = 'Bogotá'; // Cambia por el nuevo destino

const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath); // Usa la ruta absoluta correcta

async function obtenerMunicipiosGoogle(origen, destino) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes[0]) throw new Error('No se encontró ruta en Google Maps');
  const steps = data.routes[0].legs[0].steps;

  // Extrae municipios de cada step usando reverse geocoding
  const municipiosSet = new Set();
  for (const step of steps) {
    const { lat, lng } = step.end_location;
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (geoData.results && geoData.results[0]) {
      const municipio = geoData.results[0].address_components.find(comp =>
        comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
      );
      if (municipio) {
        municipiosSet.add(municipio.long_name);
      }
    }
    // Espera corta para evitar rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  // Asegura que el origen y destino estén incluidos y en orden
  return [origen, ...Array.from(municipiosSet).filter(m => m !== origen && m !== destino), destino];
}

async function poblarRutaMunicipios() {
  const municipios = await obtenerMunicipiosGoogle(origen, destino);
  console.log('Municipios detectados:', municipios);

  for (let orden = 0; orden < municipios.length; orden++) {
    const nombre = municipios[orden];

    // 1. Inserta el municipio si no existe
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO municipios (nombre) VALUES (?)',
        [nombre],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 2. Obtén el id del municipio
    const municipioId = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM municipios WHERE nombre = ?',
        [nombre],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.id);
        }
      );
    });

    // 3. Inserta en ruta_municipios
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO ruta_municipios (ruta_id, municipio_id, orden) VALUES (?, ?, ?)',
        [rutaId, municipioId, orden],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`Agregado municipio "${nombre}" (id: ${municipioId}) a ruta ${rutaId} en orden ${orden}`);
  }

  db.close();
  console.log('¡Proceso completado!');
}

poblarRutaMunicipios().catch(err => {
  console.error('Error:', err);
  db.close();
});
