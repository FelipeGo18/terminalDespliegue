const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places'; // <-- PON TU API KEY DE GOOGLE
const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath);

async function obtenerMunicipiosGoogle(origen, destino) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes[0]) throw new Error('No se encontró ruta en Google Maps');
  const steps = data.routes[0].legs[0].steps;

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
    await new Promise(r => setTimeout(r, 200));
  }
  return [origen, ...Array.from(municipiosSet).filter(m => m !== origen && m !== destino), destino];
}

async function poblarTodosRutaMunicipios() {
  // 1. Obtener todas las rutas
  const rutas = await new Promise((resolve, reject) => {
    db.all('SELECT id, origen, destino FROM rutas', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  for (const ruta of rutas) {
    console.log(`Procesando ruta ${ruta.id}: ${ruta.origen} → ${ruta.destino}`);
    try {
      // Verifica si ya existen municipios para esta ruta
      const yaPoblada = await new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as total FROM ruta_municipios WHERE ruta_id = ?',
          [ruta.id],
          (err, row) => {
            if (err) reject(err);
            else resolve(row.total > 0);
          }
        );
      });
      if (yaPoblada) {
        console.log(`Ruta ${ruta.id} ya tiene municipios asociados. Saltando...`);
        continue;
      }
      const municipios = await obtenerMunicipiosGoogle(ruta.origen, ruta.destino);
      for (let orden = 0; orden < municipios.length; orden++) {
        const nombre = municipios[orden];
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
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO ruta_municipios (ruta_id, municipio_id, orden) VALUES (?, ?, ?)',
            [ruta.id, municipioId, orden],
            function (err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
        console.log(`Agregado municipio "${nombre}" (id: ${municipioId}) a ruta ${ruta.id} en orden ${orden}`);
      }
    } catch (err) {
      console.error(`Error en ruta ${ruta.id}:`, err.message);
    }
  }
  db.close();
  console.log('¡Proceso completado para todas las rutas!');
}

poblarTodosRutaMunicipios().catch(err => {
  console.error('Error general:', err);
  db.close();
});
