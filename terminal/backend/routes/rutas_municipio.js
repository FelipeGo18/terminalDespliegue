const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las relaciones ruta-municipio
router.get('/ruta_municipios', async (req, res) => {
    try {
        const result = await db.query('SELECT rm.*, r.origen AS ruta_origen, r.destino AS ruta_destino, m.nombre AS municipio_nombre FROM ruta_municipios rm JOIN rutas r ON rm.ruta_id = r.id JOIN municipios m ON rm.municipio_id = m.id ORDER BY rm.ruta_id, rm.orden');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener las relaciones ruta-municipio:', error);
        res.status(500).json({ error: 'Error al obtener las relaciones ruta-municipio' });
    }
});

// Obtener una relación ruta-municipio por ID
router.get('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT rm.*, r.origen AS ruta_origen, r.destino AS ruta_destino, m.nombre AS municipio_nombre FROM ruta_municipios rm JOIN rutas r ON rm.ruta_id = r.id JOIN municipios m ON rm.municipio_id = m.id WHERE rm.id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener la relación ruta-municipio:', error);
        res.status(500).json({ error: 'Error al obtener la relación ruta-municipio' });
    }
});

// Crear una nueva relación ruta-municipio
router.post('/ruta_municipios', async (req, res) => {
    const { ruta_id, municipio_id, orden } = req.body;
    if (orden === undefined || orden === null || orden < 0) {
        return res.status(400).json({ error: 'El campo orden es obligatorio y debe ser un número positivo.' });
    }
    try {
        // Check if ruta_id exists
        const rutaExists = await db.query('SELECT id FROM rutas WHERE id = $1', [ruta_id]);
        if (rutaExists.rows.length === 0) {
            return res.status(400).json({ error: 'La ruta_id proporcionada no existe.' });
        }
        // Check if municipio_id exists
        const municipioExists = await db.query('SELECT id FROM municipios WHERE id = $1', [municipio_id]);
        if (municipioExists.rows.length === 0) {
            return res.status(400).json({ error: 'La municipio_id proporcionada no existe.' });
        }
        // Check for duplicate orden for the same ruta_id
        const ordenExists = await db.query('SELECT id FROM ruta_municipios WHERE ruta_id = $1 AND orden = $2', [ruta_id, orden]);
        if (ordenExists.rows.length > 0) {
            return res.status(409).json({ error: `El orden ${orden} ya existe para la ruta_id ${ruta_id}.` });
        }
        // Check for duplicate ruta_id and municipio_id combination
        const combinationExists = await db.query('SELECT id FROM ruta_municipios WHERE ruta_id = $1 AND municipio_id = $2', [ruta_id, municipio_id]);
        if (combinationExists.rows.length > 0) {
            return res.status(409).json({ error: `La combinación de ruta_id ${ruta_id} y municipio_id ${municipio_id} ya existe.` });
        }

        const result = await db.query(
            'INSERT INTO ruta_municipios (ruta_id, municipio_id, orden) VALUES ($1, $2, $3) RETURNING *',
            [ruta_id, municipio_id, orden]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear la relación ruta-municipio:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Error al crear la relación: Ya existe una entrada con esos valores (posiblemente orden duplicado para la misma ruta o combinación ruta-municipio).' });
        }
        res.status(500).json({ error: 'Error al crear la relación ruta-municipio' });
    }
});

// Actualizar una relación ruta-municipio por ID
router.put('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    const { ruta_id, municipio_id, orden } = req.body;
    if (orden === undefined || orden === null || orden < 0) {
        return res.status(400).json({ error: 'El campo orden es obligatorio y debe ser un número positivo.' });
    }
    try {
        if (ruta_id) {
            const rutaExists = await db.query('SELECT id FROM rutas WHERE id = $1', [ruta_id]);
            if (rutaExists.rows.length === 0) {
                return res.status(400).json({ error: 'La ruta_id proporcionada no existe.' });
            }
        }
        if (municipio_id) {
            const municipioExists = await db.query('SELECT id FROM municipios WHERE id = $1', [municipio_id]);
            if (municipioExists.rows.length === 0) {
                return res.status(400).json({ error: 'La municipio_id proporcionada no existe.' });
            }
        }

        // Check for duplicate orden for the same ruta_id, excluding the current item being updated
        const ordenExists = await db.query('SELECT id FROM ruta_municipios WHERE ruta_id = $1 AND orden = $2 AND id != $3', [ruta_id, orden, id]);
        if (ordenExists.rows.length > 0) {
            return res.status(409).json({ error: `El orden ${orden} ya existe para la ruta_id ${ruta_id}.` });
        }
        // Check for duplicate ruta_id and municipio_id combination, excluding the current item
        const combinationExists = await db.query('SELECT id FROM ruta_municipios WHERE ruta_id = $1 AND municipio_id = $2 AND id != $3', [ruta_id, municipio_id, id]);
        if (combinationExists.rows.length > 0) {
            return res.status(409).json({ error: `La combinación de ruta_id ${ruta_id} y municipio_id ${municipio_id} ya existe.` });
        }

        const result = await db.query(
            'UPDATE ruta_municipios SET ruta_id = $1, municipio_id = $2, orden = $3 WHERE id = $4 RETURNING *',
            [ruta_id, municipio_id, orden, id]
        );
        if (result.rowCount === 0) { // Changed from result.rows.length to result.rowCount for UPDATE
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar la relación ruta-municipio:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'Error al actualizar la relación: Ya existe otra entrada con esos valores (posiblemente orden duplicado para la misma ruta o combinación ruta-municipio).' });
        }
        res.status(500).json({ error: 'Error al actualizar la relación ruta-municipio' });
    }
});

// Eliminar una relación ruta-municipio por ID
router.delete('/ruta_municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM ruta_municipios WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) { // Changed from result.rows.length to result.rowCount for DELETE
            return res.status(404).json({ error: 'Relación ruta-municipio no encontrada' });
        }
        res.json({ message: 'Relación ruta-municipio eliminada', deletedRelation: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar la relación ruta-municipio:', error);
        res.status(500).json({ error: 'Error al eliminar la relación ruta-municipio' });
    }
});

module.exports = router;