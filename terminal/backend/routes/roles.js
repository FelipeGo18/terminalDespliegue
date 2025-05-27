const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los roles
router.get('/roles', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los roles:', error);
        res.status(500).json({ error: 'Error al obtener los roles' });
    }
});

// Obtener un rol por ID
router.get('/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Rol no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener el rol:', error);
        res.status(500).json({ error: 'Error al obtener el rol' });
    }
});

// Crear un nuevo rol
router.post('/roles', async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await db.query('INSERT INTO roles (nombre) VALUES ($1) RETURNING *', [nombre]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear el rol:', error);
        res.status(500).json({ error: 'Error al crear el rol' });
    }
});

// Actualizar un rol por ID
router.put('/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        const result = await db.query('UPDATE roles SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Rol no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar el rol:', error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
});

// Eliminar un rol por ID
router.delete('/roles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Rol no encontrado' });
        } else {
            res.json({ message: 'Rol eliminado', deletedRol: result.rows[0] });
        }
    } catch (error) {
        console.error('Error al eliminar el rol:', error);
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Error al eliminar el rol: Está siendo utilizado por uno o más usuarios.' });
        }
        res.status(500).json({ error: 'Error al eliminar el rol' });
    }
});

module.exports = router;