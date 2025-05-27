const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los municipios
router.get('/municipios', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM municipios ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los municipios:', error);
        res.status(500).json({ error: 'Error al obtener los municipios' });
    }
});

// Obtener un municipio por ID
router.get('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM municipios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Municipio no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener el municipio:', error);
        res.status(500).json({ error: 'Error al obtener el municipio' });
    }
});

// Crear un nuevo municipio
router.post('/municipios', async (req, res) => {
    const { nombre, tarifa_km } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO municipios (nombre, tarifa_km) VALUES ($1, $2) RETURNING *',
            [nombre, tarifa_km || 1.0] // Default tarifa_km if not provided
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear el municipio:', error);
        res.status(500).json({ error: 'Error al crear el municipio' });
    }
});

// Actualizar un municipio por ID
router.put('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tarifa_km } = req.body;
    try {
        const result = await db.query(
            'UPDATE municipios SET nombre = $1, tarifa_km = $2 WHERE id = $3 RETURNING *',
            [nombre, tarifa_km, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Municipio no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar el municipio:', error);
        res.status(500).json({ error: 'Error al actualizar el municipio' });
    }
});

// Eliminar un municipio por ID
router.delete('/municipios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check for dependencies in ruta_municipios before deleting
        const checkResult = await db.query('SELECT * FROM ruta_municipios WHERE municipio_id = $1', [id]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Error al eliminar el municipio: Está siendo utilizado en una o más rutas.', 
                details: `El municipio está referenciado en la tabla ruta_municipios. Considere eliminar esas referencias primero.`
            });
        }

        const result = await db.query('DELETE FROM municipios WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Municipio no encontrado' });
        } else {
            res.json({ message: 'Municipio eliminado', deletedMunicipio: result.rows[0] });
        }
    } catch (error) {
        console.error('Error al eliminar el municipio:', error);
        // Handle other potential errors, e.g., foreign key constraints if municipio_id is used elsewhere
        if (error.code === '23503') { // PostgreSQL foreign key violation
             return res.status(409).json({ error: 'Error al eliminar el municipio: Está referenciado en otra tabla.' });
        }
        res.status(500).json({ error: 'Error al eliminar el municipio' });
    }
});

module.exports = router;