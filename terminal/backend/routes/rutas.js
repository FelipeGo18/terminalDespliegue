const express = require('express');
const router = express.Router();
const db = require('../db/conecction');
const { getDistanceKm } = require('../utils/googleDistance');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las rutas
router.get('/rutas', async (req, res) => {
    try {
        const query = `
            SELECT r.id AS ruta_id, r.origen, r.destino, r.duracion_estimada, r.distancia_km,
                   e.id AS empresa_id, e.nombre AS empresa_nombre,
                   b.id AS bus_id, b.numero_bus, b.conductor_id, u_cond.nombre as conductor_nombre, b.cat_asientos,
                   v.id AS viaje_id, v.salida, v.llegada, v.precio,
                   (
                       SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id
                   ) AS tickets_ocupados
            FROM rutas r
            LEFT JOIN viajes v ON v.ruta_id = r.id
            LEFT JOIN buses b ON b.id = v.bus_id
            LEFT JOIN empresas e ON e.id = b.empresa_id
            LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
            ORDER BY r.id, v.salida;
        `;
        const { rows } = await db.query(query);

        console.log('Datos obtenidos de la base de datos:', rows);

        const rutasMap = new Map();

        rows.forEach(row => {
            if (!row.ruta_id) return; // Skip if no route (e.g. bus/empresa without routes/viajes)

            let ruta = rutasMap.get(row.ruta_id);
            if (!ruta) {
                ruta = {
                    id: row.ruta_id,
                    origen: row.origen,
                    destino: row.destino,
                    duracion_estimada: row.duracion_estimada,
                    distancia_km: row.distancia_km,
                    viajes: []
                };
                rutasMap.set(row.ruta_id, ruta);
            }

            if (row.viaje_id) { // Check if there is a viaje associated
                // Check if viaje already added to prevent duplicates if a route has multiple identical viajes (should not happen with good data)
                if (!ruta.viajes.find(v => v.id === row.viaje_id)) {
                    ruta.viajes.push({
                        id: row.viaje_id,
                        salida: row.salida,
                        llegada: row.llegada,
                        precio: row.precio,
                        tickets_ocupados: parseInt(row.tickets_ocupados, 10),
                        bus: row.bus_id ? { // Check if there is a bus associated
                            id: row.bus_id,
                            numero_bus: row.numero_bus,
                            conductor: row.conductor_nombre, // Assuming conductor name is what's needed
                            cat_asientos: row.cat_asientos,
                            empresa: row.empresa_id ? { // Check if there is an empresa associated
                                id: row.empresa_id,
                                nombre: row.empresa_nombre
                            } : null
                        } : null
                    });
                }
            }
        });

        const rutasArray = Array.from(rutasMap.values());
        console.log('Rutas procesadas:', rutasArray);
        res.json(rutasArray);

    } catch (error) {
        console.error('Error inesperado al obtener las rutas:', error);
        res.status(500).json({ error: 'Error al obtener las rutas' });
    }
});

// Obtener una ruta por ID
router.get('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM rutas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Ruta no encontrada' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener la ruta:', error);
        res.status(500).json({ error: 'Error al obtener la ruta' });
    }
});

// Crear una nueva ruta
router.post('/rutas', async (req, res) => {
    const { origen, destino, duracion_estimada, distancia_km } = req.body;
    try {
        let distanciaFinal = distancia_km;
        if (!distanciaFinal || isNaN(Number(distanciaFinal))) {
            try {
                distanciaFinal = await getDistanceKm(origen, destino);
            } catch (mapsError) {
                console.error('Error calculating distance with Google Maps:', mapsError);
                // Decide if you want to fail or use a default/null if Google Maps fails
                // For now, let's proceed with null if not provided and Maps fails
                distanciaFinal = distanciaFinal || null; 
            }
        }
        const result = await db.query(
            'INSERT INTO rutas (origen, destino, distancia_km, duracion_estimada) VALUES ($1, $2, $3, $4) RETURNING *',
            [origen, destino, distanciaFinal, duracion_estimada]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear la ruta:', error);
        res.status(500).json({ error: 'Error al crear la ruta' });
    }
});

// Actualizar una ruta por ID
router.put('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    const { origen, destino, distancia_km, duracion_estimada } = req.body;
    try {
        const result = await db.query(
            'UPDATE rutas SET origen = $1, destino = $2, distancia_km = $3, duracion_estimada = $4 WHERE id = $5 RETURNING *',
            [origen, destino, distancia_km, duracion_estimada, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Ruta no encontrada' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar la ruta:', error);
        res.status(500).json({ error: 'Error al actualizar la ruta' });
    }
});

// Eliminar una ruta por ID
router.delete('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Consider dependencies: viajes, ruta_municipios
        await client.query('DELETE FROM tickets WHERE viaje_id IN (SELECT id FROM viajes WHERE ruta_id = $1)', [id]);
        await client.query('DELETE FROM viajes WHERE ruta_id = $1', [id]);
        await client.query('DELETE FROM ruta_municipios WHERE ruta_id = $1', [id]);
        const result = await client.query('DELETE FROM rutas WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Ruta no encontrada' });
        } else {
            await client.query('COMMIT');
            res.json({ message: 'Ruta eliminada y sus viajes y tickets relacionados', deletedRuta: result.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar la ruta:', error);
        res.status(500).json({ error: 'Error al eliminar la ruta' });
    } finally {
        client.release();
    }
});

// Obtener rutas por empresa
router.get('/rutas/empresa/:empresaId', async (req, res) => {
    const { empresaId } = req.params;
    try {
        const result = await db.query(
            `SELECT DISTINCT r.*, e.nombre as empresa_nombre
             FROM rutas r
             JOIN viajes v ON v.ruta_id = r.id
             JOIN buses b ON v.bus_id = b.id
             JOIN empresas e ON b.empresa_id = e.id
             WHERE b.empresa_id = $1`,
            [empresaId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener rutas por empresa:', error);
        res.status(500).json({ error: 'Error al obtener rutas por empresa' });
    }
});

module.exports = router;