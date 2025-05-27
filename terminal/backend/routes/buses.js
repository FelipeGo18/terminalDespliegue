const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los buses
router.get('/buses', async (req, res) => {
    try {
        // Join with empresas and usuarios (for conductor name) to provide more complete bus info
        const result = await db.query(`
            SELECT b.*, e.nombre as empresa_nombre, u.nombre as conductor_nombre
            FROM buses b
            LEFT JOIN empresas e ON b.empresa_id = e.id
            LEFT JOIN usuarios u ON b.conductor_id = u.id
            ORDER BY b.numero_bus
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los buses:', error);
        res.status(500).json({ error: 'Error al obtener los buses' });
    }
});

// Obtener buses cuyo viaje inicia en un municipio intermedio (origen) y termina en el destino final de la ruta
router.get('/buses/origen-destino', async (req, res) => {
    let { origen, destino } = req.query;

    if (!origen || !destino) {
        return res.status(400).json({ error: 'Los parámetros origen y destino son obligatorios' });
    }

    origen = origen.trim().toLowerCase();
    destino = destino.trim().toLowerCase();

    try {
        const query = `
            SELECT 
                b.id AS bus_id, 
                b.numero_bus, 
                u_cond.nombre AS conductor_nombre, 
                r.origen AS ruta_origen_completa,
                r.destino AS ruta_destino_completa,
                e.nombre AS empresa_nombre,
                v.salida,
                v.llegada,
                v.id AS viaje_id,
                r.id AS ruta_id,
                r.distancia_km AS distancia_ruta_completa,
                v.precio AS precio_viaje_completo, -- Precio del viaje completo, no del tramo
                b.cat_asientos,
                (b.cat_asientos - (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id)) AS asientos_disponibles,
                rm_origen.orden AS orden_origen_match,
                rm_destino.orden AS orden_destino_match,
                m_origen.nombre AS municipio_origen_match,
                m_destino.nombre AS municipio_destino_match
            FROM buses b
            JOIN viajes v ON b.id = v.bus_id
            JOIN rutas r ON v.ruta_id = r.id
            JOIN empresas e ON b.empresa_id = e.id
            JOIN usuarios u_cond ON b.conductor_id = u_cond.id
            JOIN ruta_municipios rm_origen ON rm_origen.ruta_id = r.id
            JOIN municipios m_origen ON m_origen.id = rm_origen.municipio_id
            JOIN ruta_municipios rm_destino ON rm_destino.ruta_id = r.id
            JOIN municipios m_destino ON m_destino.id = rm_destino.municipio_id
            WHERE LOWER(TRIM(m_origen.nombre)) = $1
              AND LOWER(TRIM(m_destino.nombre)) = $2
              AND rm_origen.orden < rm_destino.orden
            ORDER BY v.salida;
        `;
        const { rows } = await db.query(query, [origen, destino]);
        
        // Aquí podrías agregar lógica para calcular el precio del tramo si es necesario
        // Por ahora, se devuelve el precio del viaje completo.
        res.json(rows);

    } catch (error) {
        console.error('Error al obtener los buses por origen y destino:', error);
        res.status(500).json({ error: 'Error al obtener los buses por origen y destino' });
    }
});

// Obtener un bus por ID
router.get('/buses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT b.*, e.nombre as empresa_nombre, u.nombre as conductor_nombre
            FROM buses b
            LEFT JOIN empresas e ON b.empresa_id = e.id
            LEFT JOIN usuarios u ON b.conductor_id = u.id
            WHERE b.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Bus no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener el bus:', error);
        res.status(500).json({ error: 'Error al obtener el bus' });
    }
});

// Obtener los buses por ruta
router.get('/buses/ruta/:rutaId', async (req, res) => {
    const { rutaId } = req.params;
    try {
        const result = await db.query(
            `SELECT b.*, e.nombre as empresa_nombre, u.nombre as conductor_nombre
             FROM buses b 
             JOIN viajes v ON b.id = v.bus_id 
             LEFT JOIN empresas e ON b.empresa_id = e.id
             LEFT JOIN usuarios u ON b.conductor_id = u.id
             WHERE v.ruta_id = $1
             GROUP BY b.id, e.nombre, u.nombre`, // Group to avoid duplicates if a bus has multiple viajes on the same route
            [rutaId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener buses por ruta:', error);
        res.status(500).json({ error: 'Error al obtener buses por ruta' });
    }
});

// Crear un nuevo bus
router.post('/buses', async (req, res) => {
    const { numero_bus, conductor_id, empresa_id, cat_asientos } = req.body; // conductor_id instead of conductor name

    if (!numero_bus || !conductor_id || !empresa_id || cat_asientos === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: numero_bus, conductor_id, empresa_id, cat_asientos.' });
    }

    try {
        // Verify conductor_id exists in usuarios table
        const conductorExists = await db.query('SELECT id FROM usuarios WHERE id = $1 AND rol_id = (SELECT id FROM roles WHERE nombre = \'Conductor\')', [conductor_id]);
        if (conductorExists.rows.length === 0) {
            return res.status(400).json({ error: 'El conductor_id proporcionado no existe o no tiene el rol de Conductor.' });
        }
        // Verify empresa_id exists in empresas table
        const empresaExists = await db.query('SELECT id FROM empresas WHERE id = $1', [empresa_id]);
        if (empresaExists.rows.length === 0) {
            return res.status(400).json({ error: 'La empresa_id proporcionada no existe.' });
        }

        const result = await db.query(
            'INSERT INTO buses (numero_bus, conductor_id, empresa_id, cat_asientos) VALUES ($1, $2, $3, $4) RETURNING *',
            [numero_bus, conductor_id, empresa_id, cat_asientos]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear el bus:', error);
        res.status(500).json({ error: 'Error al crear el bus' });
    }
});

// Actualizar un bus por ID
router.put('/buses/:id', async (req, res) => {
    const { id } = req.params;
    const { numero_bus, conductor_id, empresa_id, cat_asientos } = req.body;

    try {
        if (conductor_id) {
            const conductorExists = await db.query('SELECT id FROM usuarios WHERE id = $1 AND rol_id = (SELECT id FROM roles WHERE nombre = \'Conductor\')', [conductor_id]);
            if (conductorExists.rows.length === 0) {
                return res.status(400).json({ error: 'El conductor_id proporcionado no existe o no tiene el rol de Conductor.' });
            }
        }
        if (empresa_id) {
            const empresaExists = await db.query('SELECT id FROM empresas WHERE id = $1', [empresa_id]);
            if (empresaExists.rows.length === 0) {
                return res.status(400).json({ error: 'La empresa_id proporcionada no existe.' });
            }
        }

        const result = await db.query(
            'UPDATE buses SET numero_bus = $1, conductor_id = $2, empresa_id = $3, cat_asientos = $4 WHERE id = $5 RETURNING *',
            [numero_bus, conductor_id, empresa_id, cat_asientos, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Bus no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar el bus:', error);
        res.status(500).json({ error: 'Error al actualizar el bus' });
    }
});

// Eliminar un bus por ID
router.delete('/buses/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Before deleting a bus, delete related tickets and viajes
        await client.query('DELETE FROM tickets WHERE viaje_id IN (SELECT id FROM viajes WHERE bus_id = $1)', [id]);
        await client.query('DELETE FROM viajes WHERE bus_id = $1', [id]);
        const result = await client.query('DELETE FROM buses WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Bus no encontrado' });
        } else {
            await client.query('COMMIT');
            res.json({ message: 'Bus eliminado y sus viajes y tickets relacionados', deletedBus: result.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el bus:', error);
        res.status(500).json({ error: 'Error al eliminar el bus' });
    } finally {
        client.release();
    }
});

// Obtener buses según municipio intermedio (devuelve los buses de la ruta que pasa exactamente por ese municipio)
router.get('/buses/por-municipio', async (req, res) => {
    let { municipio } = req.query;

    if (!municipio) {
        return res.status(400).json({ error: 'El parámetro municipio es obligatorio' });
    }
    municipio = municipio.trim().toLowerCase();

    try {
        const query = `
            SELECT DISTINCT
                b.id AS bus_id, 
                b.numero_bus, 
                u_cond.nombre AS conductor_nombre, 
                r.origen AS ruta_origen,
                r.destino AS ruta_destino,
                e.nombre AS empresa_nombre,
                v.salida,
                v.llegada,
                v.id AS viaje_id,
                r.id AS ruta_id,
                b.cat_asientos,
                (b.cat_asientos - (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id)) AS asientos_disponibles,
                m.nombre AS municipio_match
            FROM buses b
            JOIN viajes v ON b.id = v.bus_id
            JOIN rutas r ON v.ruta_id = r.id
            JOIN empresas e ON b.empresa_id = e.id
            JOIN usuarios u_cond ON b.conductor_id = u_cond.id
            JOIN ruta_municipios rm ON rm.ruta_id = r.id
            JOIN municipios m ON m.id = rm.municipio_id
            WHERE LOWER(TRIM(m.nombre)) = $1
            ORDER BY v.salida;
        `;
        const { rows } = await db.query(query, [municipio]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener buses por municipio:', error);
        res.status(500).json({ error: 'Error al obtener buses por municipio' });
    }
});

module.exports = router;