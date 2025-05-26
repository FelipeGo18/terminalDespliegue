const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DELETE FROM tickets');
  db.run('DELETE FROM viajes');
  db.run('DELETE FROM buses');
  db.run('DELETE FROM rutas');
  db.run('DELETE FROM empresas');
  db.run('DELETE FROM ruta_municipios');
  db.run('DELETE FROM municipios', (err) => {
    if (err) {
      console.error('Error al vaciar la base de datos:', err);
    } else {
      console.log('¡Base de datos vaciada correctamente!');
    }
    db.close();
  });
});

// Después de ejecutar este script, puedes poblar la base de datos así:
// 1. Crea las empresas que necesitas (ejemplo: Copetran, Velotax, etc).
// 2. Crea rutas SOLO desde "Terminal Salitre Norte" hacia los destinos que quieras.
// 3. Crea los buses y asígnalos a las empresas.
// 4. Crea los viajes para esas rutas y buses.

// Ejemplo de inserciones (puedes ejecutar en SQLite o crear otro script):
/*
INSERT INTO empresas (nombre) VALUES ('Copetran');
INSERT INTO empresas (nombre) VALUES ('Velotax');
-- Agrega más empresas si lo deseas

INSERT INTO rutas (origen, destino, distancia_km, duracion_estimada) VALUES ('Terminal Salitre Norte', 'Medellín', 410, '8:00');
INSERT INTO rutas (origen, destino, distancia_km, duracion_estimada) VALUES ('Terminal Salitre Norte', 'Cali', 470, '10:00');
-- Agrega más rutas desde Terminal Salitre Norte

INSERT INTO buses (numero_bus, conductor, empresa_id, cat_asientos) VALUES ('101', 'Carlos Pérez', 1, 40);
INSERT INTO buses (numero_bus, conductor, empresa_id, cat_asientos) VALUES ('201', 'Ana Gómez', 2, 40);
-- Asigna buses a empresas

INSERT INTO viajes (bus_id, ruta_id, salida, llegada, precio) VALUES (1, 1, '2025-05-10T08:00:00', '2025-05-10T16:00:00', 120000);
-- Crea viajes para esas rutas y buses
*/
