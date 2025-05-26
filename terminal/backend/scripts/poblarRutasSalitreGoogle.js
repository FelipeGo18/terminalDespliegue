const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');

const GOOGLE_API_KEY = 'AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places'; // <-- PON TU API KEY DE GOOGLE
const dbPath = path.join(__dirname, '../db/db.db');
const db = new sqlite3.Database(dbPath);

const origen = "Terminal Salitre Norte, Bogotá, Colombia";
const destinos = [
  "AGUAZUL",
  "ALBAN CUNDINAMARCA",
  "AQUITANIA",
  "ARAUCA",
  "BARBOSA",
  "BELEN",
  "BELENCITO",
  "BERBEO",
  "BUCARAMANGA SANTANDER",
  "BUCARAMANGA",
  "CAMANCHA CUNDINAMARCA",
  "CAMPOHERMOSO",
  "CAPELLANIA",
  "CARMEN D APICALA",
  "CARMEN DE CARUPA",
  "CARTAGENA",
  "CHÍA",
  "CHICAMOCHA",
  "CHIQUINQUIRA BOYACA",
  "CHIQUINQUIRA",
  "CHISCAS",
  "CHITA BOYACA",
  "CHITARAQUE",
  "CHOCONTA CUNDINAMARCA",
  "CIENEGA",
  "CIMITARRA",
  "COGUA",
  "COPER",
  "CORRALES",
  "CUCUNUBA",
  "CUCUTA",
  "DUITAMA",
  "EL MANGO",
  "EL ROSAL",
  "FUQUENE",
  "GACHALA",
  "GACHANCIPA",
  "GACHETA",
  "GAMEZA BOYACA",
  "GARAGOA",
  "GRANADA META",
  "GUADALUPE",
  "GUADUALITO CUNDINAMARCA",
  "GUAMAL",
  "GUASCA"
];

// Variantes de sufijos para ayudar a Google a reconocer el destino
const sufijos = [
  "",
  "Cundinamarca",
  "Boyacá",
  "Santander",
  "Meta",
  "Norte de Santander",
  "Tolima",
  "Casanare",
  "Arauca",
  "Huila",
  "Colombia"
];

// Devuelve todas las variantes del destino con posibles tildes en las vocales
function generarVariantesTildes(destino) {
  const tildes = {
    a: ['a', 'á'],
    e: ['e', 'é'],
    i: ['i', 'í'],
    o: ['o', 'ó'],
    u: ['u', 'ú']
  };
  // Genera todas las combinaciones posibles con y sin tilde para cada vocal
  let variantes = [''];
  for (const char of destino) {
    const lower = char.toLowerCase();
    if (tildes[lower]) {
      const nuevas = [];
      for (const v of variantes) {
        for (const t of tildes[lower]) {
          nuevas.push(v + (char === lower ? t : t.toUpperCase()));
        }
      }
      variantes = nuevas;
    } else {
      variantes = variantes.map(v => v + char);
    }
  }
  // Elimina duplicados y retorna
  return Array.from(new Set(variantes));
}

async function getGoogleDestinationName(destino) {
  // Prueba variantes con y sin tildes y con sufijos
  const variantesBase = generarVariantesTildes(destino);
  for (const variante of variantesBase) {
    for (const sufijo of sufijos) {
      let consulta = variante;
      if (sufijo && !variante.toLowerCase().includes(sufijo.toLowerCase())) {
        consulta = `${variante}, ${sufijo}`;
      }
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(consulta + ', Colombia')}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      // Espera corta para evitar rate limit
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return null;
}

async function getDistanceAndDuration(origen, destino) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.routes.length > 0) {
    const leg = data.routes[0].legs[0];
    return {
      distancia_km: Math.round(leg.distance.value / 1000),
      duracion_estimada: leg.duration.text
    };
  }
  return { distancia_km: null, duracion_estimada: null };
}

async function poblarRutas() {
  const noReconocidos = [];
  for (const destino of destinos) {
    try {
      let destinoGoogle = await getGoogleDestinationName(destino);
      let distancia_km = null;
      let duracion_estimada = null;

      if (destinoGoogle) {
        const datos = await getDistanceAndDuration(origen, destinoGoogle);
        distancia_km = datos.distancia_km;
        duracion_estimada = datos.duracion_estimada;
      } else {
        destinoGoogle = destino; // Usa el nombre original si Google no lo reconoce
        noReconocidos.push(destino);
        console.log(`Destino NO reconocido por Google, se insertará como está: ${destino}`);
      }

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO rutas (origen, destino, distancia_km, duracion_estimada) VALUES (?, ?, ?, ?)',
          [origen, destinoGoogle, distancia_km, duracion_estimada],
          function (err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                console.log(`Ruta ya existe: ${origen} → ${destinoGoogle}`);
                resolve();
              } else {
                reject(err);
              }
            } else {
              console.log(`Ruta insertada: ${origen} → ${destinoGoogle} (${distancia_km || 'N/A'} km, ${duracion_estimada || 'N/A'})`);
              resolve();
            }
          }
        );
      });
      // Espera para evitar rate limit de Google
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`Error con destino ${destino}:`, err.message);
    }
  }
  db.close();
  console.log('¡Rutas poblabas (todas las de la lista)!');
  if (noReconocidos.length > 0) {
    console.log('\nDestinos NO reconocidos por Google, revisa manualmente:');
    noReconocidos.forEach(d => console.log('- ' + d));
  }
}

poblarRutas();
