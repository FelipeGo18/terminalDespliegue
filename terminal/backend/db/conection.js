// db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // En Render usaremos la URL completa y SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} 

// Probar conexión
pool.connect()
  .then(() => console.log('🟢 Conexión exitosa a PostgreSQL'))
  .catch(err => console.error('🔴 Error conectando a PostgreSQL:', err));

module.exports = pool;