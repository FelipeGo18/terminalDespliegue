const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db.db', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos existente:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite existente.');
    }
});

module.exports = db;