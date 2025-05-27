const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las empresas
router.get('/empresas', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM empresas');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener las empresas:', error);
        res.status(500).json({ error: 'Error al obtener las empresas' });
    }
});

// Obtener una empresa por ID
router.get('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM empresas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Empresa no encontrada' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener la empresa:', error);
        res.status(500).json({ error: 'Error al obtener la empresa' });
    }
});

// Crear una nueva empresa
router.post('/empresas', async (req, res) => {
    const { nombre } = req.body;
    try {
        const result = await db.query('INSERT INTO empresas (nombre) VALUES ($1) RETURNING *', [nombre]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear la empresa:', error);
        res.status(500).json({ error: 'Error al crear la empresa' });
    }
});

// Actualizar una empresa por ID
router.put('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        const result = await db.query('UPDATE empresas SET nombre = $1 WHERE id = $2 RETURNING *', [nombre, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Empresa no encontrada' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar la empresa:', error);
        res.status(500).json({ error: 'Error al actualizar la empresa' });
    }
});

// Eliminar una empresa por ID
router.delete('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect(); // Get a client from the pool for transaction

    try {
        await client.query('BEGIN'); // Start transaction

        // 1. Get bus IDs for the company
        const busesResult = await client.query('SELECT id FROM buses WHERE empresa_id = $1', [id]);
        const busIds = busesResult.rows.map(bus => bus.id);

        if (busIds.length > 0) {
            // Delete viajes for these buses
            await client.query('DELETE FROM viajes WHERE bus_id = ANY($1::int[])', [busIds]);
            // Delete buses of the company
            await client.query('DELETE FROM buses WHERE empresa_id = $1', [id]);
        }

        // 2. Borra rutas huérfanas (rutas sin viajes asociados)
        // This attempts to delete routes that are not referenced in any viajes.
        // Note: This specific logic for deleting orphan routes might need adjustment
        // based on exact schema and desired behavior for cascading or related data.
        const rutasResult = await client.query('SELECT id FROM rutas');
        for (const ruta of rutasResult.rows) {
            const viajeCountResult = await client.query('SELECT COUNT(*) as count FROM viajes WHERE ruta_id = $1', [ruta.id]);
            if (parseInt(viajeCountResult.rows[0].count, 10) === 0) {
                // Before deleting a route, ensure no other dependencies exist if any.
                await client.query('DELETE FROM ruta_municipios WHERE ruta_id = $1', [ruta.id]); // Example: clean related ruta_municipios
                await client.query('DELETE FROM rutas WHERE id = $1', [ruta.id]);
            }
        }
        // Alternative for deleting orphan routes (more efficient if complex dependencies are handled):
        // await client.query(`DELETE FROM rutas r WHERE NOT EXISTS (SELECT 1 FROM viajes v WHERE v.ruta_id = r.id)`);


        // 3. Borra la empresa
        const deleteEmpresaResult = await client.query('DELETE FROM empresas WHERE id = $1 RETURNING *', [id]);

        if (deleteEmpresaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Empresa y datos relacionados eliminados', deletedEmpresa: deleteEmpresaResult.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar la empresa y sus datos relacionados:', error);
        res.status(500).json({ error: 'Error al eliminar la empresa y sus datos relacionados' });
    } finally {
        client.release();
    }
});

module.exports = router;