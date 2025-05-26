const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath);

// Empresas reales que operan en Terminal Salitre Norte (según tu lista)
const empresas = [
  "Flota Águila",
  "Flota Boyacá",
  "Flota San Vicente S.A.",
  "Flota Valle de Tenza",
  "Flota Zipa",
  "Expreso Brasilia S.A.",
  "Expreso Bolivariano",
  "Expreso el Sol S.A.",
  "Expreso Gaviota S.A.",
  "Rápido Duitama",
  "Rápido El Carmen Ltda.",
  "Rápido Ochoa",
  "Transportes Arizona S.A.",
  "CootransZipa",
  "CotransHuila",
  "Continental Bus S.A.",
  "Copetran"
];

// Asociación de rutas a empresas (solo rutas plausibles desde Salitre Norte)
const rutasPorEmpresa = {
  "Flota Águila": [
    "Chiquinquirá, Boyacá", "Chiquinquirá", "Belén", "Belencito", "Berbeo", "Corrales", "Gámeza, Boyacá"
  ],
  "Flota Boyacá": [
    "Duitama", "Aquitania", "Chita, Boyacá", "Chitaraque", "Garagoa"
  ],
  "Flota San Vicente S.A.": [
    "Campohermoso", "Garagoa", "Guadalupe"
  ],
  "Flota Valle de Tenza": [
    "Guateque", "Guayatá", "Somondoco", "Sutatenza"
  ],
  "Flota Zipa": [
    "Zipaquirá", "Cogua", "Cucunubá", "Gachetá"
  ],
  "Expreso Brasilia S.A.": [
    "Cartagena"
  ],
  "Expreso Bolivariano": [
    "Cartagena", "Cúcuta", "Bucaramanga, Santander", "Duitama", "Chiquinquirá, Boyacá", "Chía"
  ],
  "Expreso el Sol S.A.": [
    "Barbosa", "Cimitarra", "Bucaramanga, Santander"
  ],
  "Expreso Gaviota S.A.": [
    "Aguazul", "Arauca", "Granada, Meta"
  ],
  "Rápido Duitama": [
    "Duitama", "Chiquinquirá, Boyacá", "Aquitania", "Belén", "Belencito", "Berbeo", "Chita, Boyacá", "Chitaraque", "Corrales", "Gámeza, Boyacá"
  ],
  "Rápido El Carmen Ltda.": [
    "Carmen de Carupa", "Carmen de Apicalá"
  ],
  "Rápido Ochoa": [
    "Cartagena"
  ],
  "Transportes Arizona S.A.": [
    "Chocontá, Cundinamarca, ","Gachancipá"
  ],
  "CootransZipa": [
    "Zipaquirá", "Cogua", "Cucunubá"
  ],
  "CotransHuila": [
    "Campohermoso", "Garagoa", "Guadalupe"
  ],
  "Continental Bus S.A.": [
    "Guateque", "Guayatá"
  ],
  "Copetran": [
    "Bucaramanga, Santander", "Cúcuta", "Aguazul", "Arauca", "Barbosa", "Duitama", "Campohermoso", "Garagoa", "Granada, Meta"
  ]
};

// Buses ficticios pero plausibles por empresa
const busesPorEmpresa = {
  "Flota Águila": [
    { numero_bus: "AGU-101", conductor: "Carlos Pérez", cat_asientos: 40 }
  ],
  "Flota Boyacá": [
    { numero_bus: "BOY-201", conductor: "Ana Gómez", cat_asientos: 40 }
  ],
  "Flota San Vicente S.A.": [
    { numero_bus: "SVI-301", conductor: "Pedro Gómez", cat_asientos: 38 }
  ],
  "Flota Valle de Tenza": [
    { numero_bus: "TEN-401", conductor: "Jorge Torres", cat_asientos: 42 }
  ],
  "Flota Zipa": [
    { numero_bus: "ZIP-501", conductor: "Sandra Ruiz", cat_asientos: 34 }
  ],
  "Expreso Brasilia S.A.": [
    { numero_bus: "BRA-601", conductor: "Oscar Díaz", cat_asientos: 40 }
  ],
  "Expreso Bolivariano": [
    { numero_bus: "BOL-701", conductor: "Gloria Peña", cat_asientos: 40 }
  ],
  "Expreso el Sol S.A.": [
    { numero_bus: "SOL-801", conductor: "Hernán Silva", cat_asientos: 38 }
  ],
  "Expreso Gaviota S.A.": [
    { numero_bus: "GAV-901", conductor: "Marta Ríos", cat_asientos: 36 }
  ],
  "Rápido Duitama": [
    { numero_bus: "RDU-1001", conductor: "Ricardo León", cat_asientos: 40 }
  ],
  "Rápido El Carmen Ltda.": [
    { numero_bus: "REC-1101", conductor: "Luis Martínez", cat_asientos: 36 }
  ],
  "Rápido Ochoa": [
    { numero_bus: "OCH-1201", conductor: "María López", cat_asientos: 36 }
  ],
  "Transportes Arizona S.A.": [
    { numero_bus: "ARI-1301", conductor: "Pedro Gómez", cat_asientos: 38 }
  ],
  "CootransZipa": [
    { numero_bus: "COZ-1401", conductor: "Jorge Torres", cat_asientos: 42 }
  ],
  "CotransHuila": [
    { numero_bus: "HU-1501", conductor: "Sandra Ruiz", cat_asientos: 34 }
  ],
  "Continental Bus S.A.": [
    { numero_bus: "CON-1601", conductor: "Oscar Díaz", cat_asientos: 40 }
  ],
  "Copetran": [
    { numero_bus: "COP-1701", conductor: "Gloria Peña", cat_asientos: 40 }
  ]
};

db.serialize(() => {
  // 1. Insertar empresas
  const empresaIds = {};
  empresas.forEach((nombre, idx) => {
    db.run('INSERT OR IGNORE INTO empresas (nombre) VALUES (?)', [nombre], function (err) {
      if (err) {
        console.error('Error insertando empresa:', nombre, err);
      } else {
        empresaIds[nombre] = this.lastID || idx + 1; // fallback si no hay lastID
      }
    });
  });

  // Espera un poco para que las empresas se inserten antes de insertar buses
  setTimeout(() => {
    // 2. Insertar buses asociados a empresas
    Object.entries(busesPorEmpresa).forEach(([empresa, buses]) => {
      db.get('SELECT id FROM empresas WHERE nombre = ?', [empresa], (err, row) => {
        if (err || !row) {
          console.error('Empresa no encontrada para bus:', empresa);
          return;
        }
        const empresa_id = row.id;
        buses.forEach(bus => {
          db.run(
            'INSERT INTO buses (numero_bus, conductor, empresa_id, cat_asientos) VALUES (?, ?, ?, ?)',
            [bus.numero_bus, bus.conductor, empresa_id, bus.cat_asientos],
            function (err2) {
              if (err2) {
                console.error('Error insertando bus:', bus.numero_bus, err2);
              } else {
                console.log(`Bus insertado: ${bus.numero_bus} (${empresa})`);
              }
            }
          );
        });
      });
    });
  }, 1000);

  // Finaliza la conexión después de un tiempo
  setTimeout(() => {
    db.close();
    console.log('Empresas y buses insertados.');
  }, 4000);
});
