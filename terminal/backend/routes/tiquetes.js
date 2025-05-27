const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los tickets
router.get('/tickets', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tickets');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los tickets:', error);
        res.status(500).json({ error: 'Error al obtener los tickets' });
    }
});

// Obtener un ticket por ID
router.get('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el ticket:', error);
        res.status(500).json({ error: 'Error al obtener el ticket' });
    }
});

// Crear un nuevo ticket con detalles
router.post('/tickets', async (req, res) => {
    const { usuario_id, viaje_id, asiento } = req.body;

    console.log('Datos recibidos en el servidor:', { usuario_id, viaje_id, asiento }); // Depuración

    try {
        // Verificar existencia del usuario
        const usuarioResult = await db.query('SELECT * FROM usuarios WHERE id = $1', [usuario_id]);
        if (usuarioResult.rows.length === 0) return res.status(400).json({ error: 'El usuario no existe' });

        // Verificar existencia del viaje y obtener bus_id y otros detalles
        const viajeResultQuery = await db.query(
            `SELECT v.*, b.cat_asientos, b.numero_bus, conductor.nombre as conductor_nombre, e.nombre as empresa_nombre, r.origen, r.destino
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN usuarios conductor ON b.conductor_id = conductor.id
             JOIN empresas e ON b.empresa_id = e.id
             JOIN rutas r ON v.ruta_id = r.id
             WHERE v.id = $1`,
            [viaje_id]
        );
        if (viajeResultQuery.rows.length === 0) return res.status(400).json({ error: 'El viaje no existe' });
        const viajeResult = viajeResultQuery.rows[0];

        // Verificar si el asiento ya está ocupado
        const asientoResult = await db.query('SELECT * FROM tickets WHERE viaje_id = $1 AND asiento = $2', [viaje_id, asiento]);
        if (asientoResult.rows.length > 0) return res.status(400).json({ error: 'El asiento ya está ocupado' });

        // Verificar si el bus está lleno
        const totalOcupadosResult = await db.query('SELECT COUNT(*) as count FROM tickets WHERE viaje_id = $1', [viaje_id]);
        const totalOcupados = parseInt(totalOcupadosResult.rows[0].count, 10);
        if (totalOcupados >= viajeResult.cat_asientos) return res.status(400).json({ error: 'El bus está lleno' });

        // Crear el ticket
        const ticketInsertResult = await db.query(
            'INSERT INTO tickets (usuario_id, viaje_id, asiento, fecha_compra) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [usuario_id, viaje_id, asiento]
        );
        const ticketInsert = ticketInsertResult.rows[0];

        const responseData = {
            id: ticketInsert.id,
            nombre: usuarioResult.rows[0].nombre,
            origen: viajeResult.origen,
            destino: viajeResult.destino,
            salida: viajeResult.salida,
            llegada: viajeResult.llegada,
            numero_bus: viajeResult.numero_bus,
            conductor: viajeResult.conductor_nombre,
            empresa: viajeResult.empresa_nombre,
            asiento,
            fecha: ticketInsert.fecha_compra, // Usar la fecha de la BD
            precio: viajeResult.precio
        };

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error al crear el ticket:', error);
        res.status(500).json({ error: 'Error al crear el ticket' });
    }
});

// Actualizar un ticket por ID
router.put('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id, viaje_id, asiento, fecha_compra } = req.body;
    try {
        const result = await db.query(
            'UPDATE tickets SET usuario_id = $1, viaje_id = $2, asiento = $3, fecha_compra = $4 WHERE id = $5 RETURNING *',
            [usuario_id, viaje_id, asiento, fecha_compra, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json({ message: 'Ticket actualizado', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar el ticket:', error);
        res.status(500).json({ error: 'Error al actualizar el ticket' });
    }
});

// Eliminar un ticket por ID
router.delete('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json({ message: 'Ticket eliminado', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error al eliminar el ticket:', error);
        res.status(500).json({ error: 'Error al eliminar el ticket' });
    }
});

module.exports = router;
