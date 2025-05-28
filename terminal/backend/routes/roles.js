const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los roles
router.get('/roles', async (req, res) => {
    try {
        db.all('SELECT * FROM roles', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener los roles' });
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los roles' });
    }
});

// Obtener un rol por ID
router.get('/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM roles WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener el rol' });
            } else if (!row) {
                res.status(404).json({ error: 'Rol no encontrado' });
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el rol' });
    }
});

// Crear un nuevo rol
router.post('/roles', async (req, res) => {
    const { nombre } = req.body;
    try {
        db.run('INSERT INTO roles (nombre) VALUES (?)', [nombre], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al crear el rol' });
            } else {
                res.status(201).json({ id: this.lastID, nombre });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el rol' });
    }
});

// Actualizar un rol por ID
router.put('/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        db.run('UPDATE roles SET nombre = ? WHERE id = ?', [nombre, id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al actualizar el rol' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Rol no encontrado' });
            } else {
                res.json({ id, nombre });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
});

// Eliminar un rol por ID
router.delete('/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run('DELETE FROM roles WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar el rol' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Rol no encontrado' });
            } else {
                res.json({ message: 'Rol eliminado' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el rol' });
    }
});

module.exports = router;