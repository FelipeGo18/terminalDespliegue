const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'db.db');

if (!fs.existsSync(dbPath)) {
    console.error('Error: La base de datos db.db no existe en la carpeta db.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});

module.exports = db;