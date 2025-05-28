const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las relaciones ruta-municipio
router.get('/ruta_municipios', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ruta_municipios');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las relaciones ruta-municipio' });
    }
});

// Obtener una relación ruta-municipio por ID
router.get('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM ruta_municipios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la relación ruta-municipio' });
    }
});

// Crear una nueva relación ruta-municipio
router.post('/ruta_municipios', async (req, res) => {
    const { ruta_id, municipio_id, orden } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO ruta_municipios (ruta_id, municipio_id, orden) VALUES ($1, $2, $3) RETURNING *',
            [ruta_id, municipio_id, orden]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la relación ruta-municipio' });
    }
});

// Actualizar una relación ruta-municipio por ID
router.put('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    const { ruta_id, municipio_id, orden } = req.body;
    try {
        const result = await db.query(
            'UPDATE ruta_municipios SET ruta_id = $1, municipio_id = $2, orden = $3 WHERE id = $4 RETURNING *',
            [ruta_id, municipio_id, orden, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la relación ruta-municipio' });
    }
});

// Eliminar una relación ruta-municipio por ID
router.delete('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM ruta_municipios WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json({ message: 'Relación ruta-municipio eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la relación ruta-municipio' });
    }
});

module.exports = router;