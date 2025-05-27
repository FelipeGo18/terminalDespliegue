const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los viajes
router.get('/viajes', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT v.id, v.salida, v.llegada, v.precio, 
                    b.numero_bus, u_cond.nombre as conductor_nombre, 
                    r.origen, r.destino,
                    e.nombre as empresa_nombre,
                    b.cat_asientos,
                    (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id) as tickets_ocupados
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id
             JOIN empresas e ON b.empresa_id = e.id
             LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
             ORDER BY v.salida`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los viajes:', error);
        res.status(500).json({ error: 'Error al obtener los viajes' });
    }
});

// Obtener todos los viajes con información del bus y la ruta
router.get('/viajes-con-bus', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                v.id AS viaje_id,
                v.salida,
                v.llegada,
                v.precio,
                v.bus_id,
                v.ruta_id,
                b.numero_bus,
                u_cond.nombre as conductor_nombre,
                b.cat_asientos,
                (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id) as tickets_ocupados,
                r.origen,
                r.destino,
                e.nombre as empresa_nombre
            FROM viajes v
            JOIN buses b ON v.bus_id = b.id
            JOIN rutas r ON v.ruta_id = r.id
            JOIN empresas e ON b.empresa_id = e.id
            LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
            ORDER BY v.salida`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los viajes con bus:', error);
        res.status(500).json({ error: 'Error al obtener los viajes con bus' });
    }
});

// Obtener un viaje por ID
router.get('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            `SELECT v.id, v.salida, v.llegada, v.precio,
                    b.numero_bus, u_cond.nombre as conductor_nombre, 
                    r.origen, r.destino,
                    e.nombre as empresa_nombre,
                    b.cat_asientos,
                    (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id) as tickets_ocupados
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id
             JOIN empresas e ON b.empresa_id = e.id
             LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
             WHERE v.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Viaje no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener el viaje:', error);
        res.status(500).json({ error: 'Error al obtener el viaje' });
    }
});

// Obtener los viajes de una ruta específica
router.get('/viajes/ruta/:rutaId', async (req, res) => {
    const { rutaId } = req.params;
    try {
        const result = await db.query(
            `SELECT v.id, v.salida, v.llegada, v.precio, v.bus_id, v.ruta_id, 
                    b.numero_bus, u_cond.nombre as conductor_nombre, b.cat_asientos,
                    (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id) as tickets_ocupados,
                    e.nombre as empresa_nombre
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
             JOIN empresas e ON b.empresa_id = e.id
             WHERE v.ruta_id = $1
             ORDER BY v.salida`,
            [rutaId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los viajes por ruta:', error);
        res.status(500).json({ error: 'Error al obtener los viajes por ruta' });
    }
});

// Obtener los viajes de una empresa específica
router.get('/viajes/empresa/:empresaId', async (req, res) => {
    const { empresaId } = req.params;
    try {
        const result = await db.query(
            `SELECT v.id, v.salida, v.llegada, v.precio, 
                    b.numero_bus, u_cond.nombre as conductor_nombre, 
                    r.origen, r.destino,
                    e.nombre as empresa_nombre,
                    b.cat_asientos,
                    (SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id) as tickets_ocupados
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id
             JOIN empresas e ON b.empresa_id = e.id
             LEFT JOIN usuarios u_cond ON b.conductor_id = u_cond.id
             WHERE b.empresa_id = $1
             ORDER BY v.salida`,
            [empresaId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los viajes por empresa:', error);
        res.status(500).json({ error: 'Error al obtener los viajes por empresa' });
    }
});

// Crear un nuevo viaje (precio fijo para ruta principal)
router.post('/viajes', async (req, res) => {
    const { bus_id, ruta_id, salida, llegada, precio } = req.body;

    if (!bus_id || !ruta_id || !salida || !llegada || precio === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios: bus_id, ruta_id, salida, llegada, precio.' });
    }

    try {
        // Verificar si el bus existe
        const busResult = await db.query('SELECT id FROM buses WHERE id = $1', [bus_id]);
        if (busResult.rows.length === 0) {
            return res.status(400).json({ error: 'El bus especificado no existe.' });
        }

        // Verificar si la ruta existe
        const rutaResult = await db.query('SELECT id FROM rutas WHERE id = $1', [ruta_id]);
        if (rutaResult.rows.length === 0) {
            return res.status(400).json({ error: 'La ruta especificada no existe.' });
        }

        // Validar que la fecha de salida sea anterior a la fecha de llegada
        if (new Date(salida) >= new Date(llegada)) {
            return res.status(400).json({ error: 'La fecha de salida debe ser anterior a la fecha de llegada.' });
        }

        const result = await db.query(
            'INSERT INTO viajes (bus_id, ruta_id, salida, llegada, precio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [bus_id, ruta_id, salida, llegada, precio]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear el viaje:', error);
        res.status(500).json({ error: 'Error al crear el viaje' });
    }
});

// Calcular precio de un tramo intermedio (no crea viaje, solo devuelve el precio)
router.post('/viajes/tramo', async (req, res) => {
    const { ruta_id, origen_municipio_id, destino_municipio_id } = req.body;

    if (!ruta_id || !origen_municipio_id || !destino_municipio_id) {
        return res.status(400).json({ error: 'ruta_id, origen_municipio_id y destino_municipio_id son obligatorios.' });
    }

    if (origen_municipio_id === destino_municipio_id) {
        return res.status(400).json({ error: 'El municipio de origen y destino no pueden ser el mismo.' });
    }

    try {
        const rutaQuery = await db.query('SELECT * FROM rutas WHERE id = $1', [ruta_id]);
        if (rutaQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Ruta no encontrada.' });
        }

        const origenTramoQuery = await db.query(
            'SELECT rm.orden, m.tarifa_km, m.nombre FROM ruta_municipios rm JOIN municipios m ON rm.municipio_id = m.id WHERE rm.ruta_id = $1 AND rm.municipio_id = $2',
            [ruta_id, origen_municipio_id]
        );
        const destinoTramoQuery = await db.query(
            'SELECT rm.orden, m.tarifa_km, m.nombre FROM ruta_municipios rm JOIN municipios m ON rm.municipio_id = m.id WHERE rm.ruta_id = $1 AND rm.municipio_id = $2',
            [ruta_id, destino_municipio_id]
        );

        if (origenTramoQuery.rows.length === 0 || destinoTramoQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Uno o ambos municipios no se encuentran en la ruta especificada.' });
        }

        const origenTramo = origenTramoQuery.rows[0];
        const destinoTramo = destinoTramoQuery.rows[0];

        if (origenTramo.orden >= destinoTramo.orden) {
            return res.status(400).json({ error: 'El municipio de origen debe tener un orden menor al municipio de destino en la ruta.' });
        }

        const numeroDeSegmentos = destinoTramo.orden - origenTramo.orden;
        const tarifaKmOrigen = parseFloat(origenTramo.tarifa_km);
        // This is a placeholder, assuming an average of 10km per segment between municipalities in a route.
        // A more accurate system would store the actual distance between consecutive municipalities in the `ruta_municipios` table or a similar structure.
        const distanciaEstimadaTramo = numeroDeSegmentos * 10; 
        const precioCalculado = distanciaEstimadaTramo * tarifaKmOrigen;

        res.json({
            ruta_id,
            origen_municipio: { id: origen_municipio_id, nombre: origenTramo.nombre, orden: origenTramo.orden },
            destino_municipio: { id: destino_municipio_id, nombre: destinoTramo.nombre, orden: destinoTramo.orden },
            precio_calculado: precioCalculado.toFixed(2),
            mensaje: "Precio calculado es una estimación basada en el número de segmentos y tarifa del municipio de origen. La distancia por segmento es un placeholder (10km)."
        });

    } catch (error) {
        console.error('Error al calcular el precio del tramo:', error);
        res.status(500).json({ error: 'Error al calcular el precio del tramo' });
    }
});

// Actualizar un viaje por ID
router.put('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    const { bus_id, ruta_id, salida, llegada, precio } = req.body;
    try {
        if (salida && llegada && new Date(salida) >= new Date(llegada)) {
            return res.status(400).json({ error: 'La fecha de salida debe ser anterior a la fecha de llegada.' });
        }

        const result = await db.query(
            'UPDATE viajes SET bus_id = $1, ruta_id = $2, salida = $3, llegada = $4, precio = $5 WHERE id = $6 RETURNING *',
            [bus_id, ruta_id, salida, llegada, precio, id]
        );
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Viaje no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar el viaje:', error);
        res.status(500).json({ error: 'Error al actualizar el viaje' });
    }
});

// Eliminar un viaje por ID
router.delete('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM tickets WHERE viaje_id = $1', [id]);
        const result = await client.query('DELETE FROM viajes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Viaje no encontrado' });
        } else {
            await client.query('COMMIT');
            res.json({ message: 'Viaje y tickets asociados eliminados', deletedViaje: result.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el viaje:', error);
        res.status(500).json({ error: 'Error al eliminar el viaje' });
    } finally {
        client.release();
    }
});

module.exports = router;