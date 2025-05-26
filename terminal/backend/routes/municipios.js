const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los municipios
router.get('/municipios', async (req, res) => {
    try {
        db.all('SELECT * FROM municipios', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener los municipios' });
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los municipios' });
    }
});

// Obtener un municipio por ID
router.get('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM municipios WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener el municipio' });
            } else if (!row) {
                res.status(404).json({ error: 'Municipio no encontrado' });
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el municipio' });
    }
});

// Crear un nuevo municipio
router.post('/municipios', async (req, res) => {
    const { nombre, tarifa_km } = req.body;
    try {
        db.run('INSERT INTO municipios (nombre, tarifa_km) VALUES (?, ?)', [nombre, tarifa_km || 1.0], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al crear el municipio' });
            } else {
                res.status(201).json({ id: this.lastID, nombre, tarifa_km: tarifa_km || 1.0 });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el municipio' });
    }
});

// Actualizar un municipio por ID
router.put('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tarifa_km } = req.body;
    try {
        db.run('UPDATE municipios SET nombre = ?, tarifa_km = ? WHERE id = ?', [nombre, tarifa_km, id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al actualizar el municipio' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Municipio no encontrado' });
            } else {
                res.json({ id, nombre, tarifa_km });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el municipio' });
    }
});

// Eliminar un municipio por ID
router.delete('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run('DELETE FROM municipios WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar el municipio' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Municipio no encontrado' });
            } else {
                res.json({ message: 'Municipio eliminado' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el municipio' });
    }
});

module.exports = router;