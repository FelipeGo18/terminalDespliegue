const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath);

function randomDateTimeInNext7Days() {
  const now = new Date();
  const randomDayOffset = Math.floor(Math.random() * 7); // 0-6 días
  const randomHour = 4 + Math.floor(Math.random() * 16); // 4-19 horas (4:00 a 19:59, último sale antes de las 20:00)
  const randomMinute = Math.floor(Math.random() * 60);
  const salida = new Date(now);
  salida.setDate(now.getDate() + randomDayOffset);
  salida.setHours(randomHour, randomMinute, 0, 0);
  return salida;
}

// Suma una duración tipo "8:00" (horas:minutos o "8 horas" o "8 h") a una fecha
function sumarDuracion(fecha, duracion) {
  if (!duracion) return fecha;
  let horas = 0, minutos = 0;
  if (/^\d+:\d+$/.test(duracion)) {
    // Formato "8:00"
    [horas, minutos] = duracion.split(':').map(Number);
  } else if (/(\d+)\s*h/.test(duracion)) {
    // Formato "8 h" o "8 horas"
    const match = duracion.match(/(\d+)\s*h/);
    horas = match ? Number(match[1]) : 0;
    const minMatch = duracion.match(/(\d+)\s*min/);
    minutos = minMatch ? Number(minMatch[1]) : 0;
  } else if (/(\d+)\s*hora/.test(duracion)) {
    // Formato "8 horas"
    const match = duracion.match(/(\d+)\s*hora/);
    horas = match ? Number(match[1]) : 0;
    const minMatch = duracion.match(/(\d+)\s*min/);
    minutos = minMatch ? Number(minMatch[1]) : 0;
  }
  const llegada = new Date(fecha);
  llegada.setHours(llegada.getHours() + (horas || 0));
  llegada.setMinutes(llegada.getMinutes() + (minutos || 0));
  return llegada;
}

// Tarifa base por kilómetro (ajusta según tu criterio empresarial)
// Ejemplo: $120/km es más realista para buses intermunicipales en Colombia
const TARIFA_KM = 120;

async function poblarViajesPorRuta() {
  // 1. Obtener todas las rutas con distancia y duración
  const rutas = await new Promise((resolve, reject) => {
    db.all('SELECT id, duracion_estimada, distancia_km FROM rutas', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  for (const ruta of rutas) {
    // 2. Buscar un bus disponible para la ruta (bus de cualquier empresa)
    const bus = await new Promise((resolve, reject) => {
      db.get(
        `SELECT b.id FROM buses b
         ORDER BY RANDOM()
         LIMIT 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!bus) {
      console.log(`No hay bus disponible para ruta ${ruta.id}, omitiendo...`);
      continue;
    }

    // 3. Generar salida y llegada
    const salida = randomDateTimeInNext7Days();
    const llegada = sumarDuracion(salida, ruta.duracion_estimada);

    // 4. Calcular precio según distancia
    let precio = 0;
    if (ruta.distancia_km && !isNaN(Number(ruta.distancia_km))) {
      precio = Math.round(Number(ruta.distancia_km) * TARIFA_KM);
      // Precio mínimo razonable
      if (precio < 8000) precio = 8000;
    } else {
      precio = 15000; // fallback si no hay distancia
    }

    // 5. Crear el viaje
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO viajes (bus_id, ruta_id, salida, llegada, precio) VALUES (?, ?, ?, ?, ?)',
        [
          bus.id,
          ruta.id,
          salida.toISOString().slice(0, 16), // formato "YYYY-MM-DDTHH:mm"
          llegada.toISOString().slice(0, 16),
          precio
        ],
        function (err) {
          if (err) {
            console.error(`Error creando viaje para ruta ${ruta.id}:`, err.message);
            reject(err);
          } else {
            console.log(`Viaje creado para ruta ${ruta.id} con bus ${bus.id} (precio: $${precio})`);
            resolve();
          }
        }
      );
    });
  }

  db.close();
  console.log('¡Viajes poblados por ruta!');
}

poblarViajesPorRuta().catch(err => {
  console.error('Error general:', err);
  db.close();
});
