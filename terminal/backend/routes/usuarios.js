const express = require('express');
const router = express.Router();
const db = require('../db/conecction');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.use(express.json()); // Middleware para parsear JSON

// Almacén temporal de códigos de verificación (en memoria, para demo)
const verificationCodes = {};

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        // Exclude password from the general user list
        const result = await db.query('SELECT id, nombre, email, rol_id, verificado FROM usuarios ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

// Obtener un usuario por ID
router.get('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Exclude password when fetching a single user by ID for general purposes
        const result = await db.query('SELECT id, nombre, email, rol_id, verificado FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// Crear un nuevo usuario (ahora inicia como no verificado)
router.post('/usuarios', async (req, res) => {
    const { nombre, email, contraseña, rol_id } = req.body; // rol_id can be optional, default to 3 if not provided
    const default_rol_id = rol_id || 3; // Default to rol_id 3 (e.g., 'Usuario') if not specified

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios.' });
    }

    try {
        // Check if email already exists
        const emailExists = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
        }

        // Check if rol_id exists if provided
        if (rol_id) {
            const rolExistsQuery = await db.query('SELECT id FROM roles WHERE id = $1', [rol_id]);
            if (rolExistsQuery.rows.length === 0) {
                return res.status(400).json({ error: `El rol_id ${rol_id} no es válido.` });
            }
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);
        const result = await db.query(
            'INSERT INTO usuarios (nombre, email, contraseña, rol_id, verificado) VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, email, rol_id, verificado',
            [nombre, email, hashedPassword, default_rol_id, false] // verificado defaults to false
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        if (error.code === '23505') { // Unique constraint violation (likely email)
            return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// Actualizar un usuario por ID
router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, contraseña, rol_id, verificado } = req.body;

    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (nombre) {
        updateFields.push(`nombre = $${paramIndex++}`);
        queryParams.push(nombre);
    }
    if (email) {
        // Check if new email already exists for another user
        const emailExists = await db.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [email, id]);
        if (emailExists.rows.length > 0) {
            return res.status(409).json({ error: 'El nuevo correo electrónico ya está registrado por otro usuario.' });
        }
        updateFields.push(`email = $${paramIndex++}`);
        queryParams.push(email);
    }
    if (contraseña) {
        const hashedPassword = await bcrypt.hash(contraseña, 10);
        updateFields.push(`contraseña = $${paramIndex++}`);
        queryParams.push(hashedPassword);
    }
    if (rol_id) {
        const rolExistsQuery = await db.query('SELECT id FROM roles WHERE id = $1', [rol_id]);
        if (rolExistsQuery.rows.length === 0) {
            return res.status(400).json({ error: `El rol_id ${rol_id} no es válido.` });
        }
        updateFields.push(`rol_id = $${paramIndex++}`);
        queryParams.push(rol_id);
    }
    if (verificado !== undefined) {
        updateFields.push(`verificado = $${paramIndex++}`);
        queryParams.push(verificado);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    queryParams.push(id); // For the WHERE id = $N clause

    const queryString = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, nombre, email, rol_id, verificado`;

    try {
        const result = await db.query(queryString, queryParams);
        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        if (error.code === '23505') { // Unique constraint violation (likely email)
            return res.status(409).json({ error: 'El correo electrónico ya está registrado por otro usuario.' });
        }
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

// Eliminar un usuario por ID
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.connect(); // Use a client for potential transaction
    try {
        await client.query('BEGIN');
        // Consider dependencies: tickets, or if user is a conductor for a bus, etc.
        // 1. Delete tickets associated with the user
        await client.query('DELETE FROM tickets WHERE usuario_id = $1', [id]);
        
        // 2. Handle buses if the user is a conductor
        // Option A: Set conductor_id to NULL for buses driven by this user
        await client.query('UPDATE buses SET conductor_id = NULL WHERE conductor_id = $1', [id]);
        // Option B: Prevent deletion if user is an active conductor (more complex, depends on requirements)
        // const busCheck = await client.query('SELECT id FROM buses WHERE conductor_id = $1', [id]);
        // if (busCheck.rows.length > 0) {
        //     await client.query('ROLLBACK');
        //     return res.status(409).json({ error: 'No se puede eliminar el usuario: es conductor asignado a uno o más buses. Reasigne los buses primero.'});
        // }

        // 3. Delete the user
        const result = await client.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email', [id]);
        
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Usuario no encontrado' });
        } else {
            await client.query('COMMIT');
            res.json({ message: 'Usuario eliminado y referencias actualizadas/eliminadas', deletedUser: result.rows[0] });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    } finally {
        client.release();
    }
});

// Endpoint para inicio de sesión (solo si está verificado)
router.post('/usuarios/login', async (req, res) => {
    const { email, contraseña } = req.body;
    if (!email || !contraseña) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' }); // Generic error for non-existent user
        }
        const usuario = result.rows[0];

        if (!usuario.verificado) {
            return res.status(401).json({ error: 'Usuario no verificado. Por favor, verifica tu correo electrónico.' });
        }

        const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol_id: usuario.rol_id }, 
            process.env.JWT_SECRET || 'your_default_jwt_secret', // Use environment variable for secret
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Do not send password back
        const { contraseña: _, ...usuarioSinContraseña } = usuario;
        res.json({ token, usuario: usuarioSinContraseña });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Endpoint para enviar código de verificación al correo
router.post('/usuarios/enviar-codigo', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar el código en memoria (en producción usar Redis o DB)
    verificationCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutos

    // Configura tu transporte de nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'trasmileniopruebas@gmail.com', // Cambia por tu correo
            pass: 'nhbrvpeyyljakcze' // Usa contraseña de aplicación
        }
    });

    const mailOptions = {
        from: 'trasmileniopruebas@gmail.com', // Aquí pon el MISMO correo que usas en auth.user arriba
        to: email,
        subject: 'Código de verificación',
        text: `Tu código de verificación es: ${code}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Código enviado al correo' });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ error: 'No se pudo enviar el correo' });
    }
});

// Endpoint para verificar el código y marcar usuario como verificado
router.post('/usuarios/verificar-codigo', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email y código requeridos' });

    const entry = verificationCodes[email];
    if (!entry) return res.status(400).json({ error: 'No se ha solicitado código para este correo o ya fue verificado.' });
    if (entry.expires < Date.now()) {
        delete verificationCodes[email]; // Clean up expired code
        return res.status(400).json({ error: 'El código ha expirado' });
    }

    if (entry.code === code) {
        try {
            const result = await db.query('UPDATE usuarios SET verificado = true WHERE email = $1 RETURNING id', [email]);
            delete verificationCodes[email]; // Clean up used code
            if (result.rowCount === 0) {
                // Should not happen if code was requested for an existing user, but good to check
                return res.status(404).json({ error: 'Usuario no encontrado para verificar.' }); 
            }
            return res.json({ message: 'Código verificado correctamente. Usuario activado.' });
        } catch (dbError) {
            console.error('Error al actualizar usuario como verificado:', dbError);
            return res.status(500).json({ error: 'Error al verificar el código en la base de datos.' });
        }
    } else {
        return res.status(400).json({ error: 'Código incorrecto' });
    }
});

// Endpoint para enviar link de recuperación de contraseña
router.post('/usuarios/enviar-recuperacion', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
        const userQuery = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const usuario = userQuery.rows[0];

        if (!usuario.verificado) {
            return res.status(401).json({ error: 'El usuario no está verificado. No se puede recuperar la contraseña.' });
        }

        const token = jwt.sign(
            { email: usuario.email, purpose: 'password-reset' },
            process.env.JWT_RESET_SECRET || 'your_default_jwt_reset_secret', // Use a different secret for password reset
            { expiresIn: '15m' } // Token expires in 15 minutes
        );
        
        // No longer storing reset tokens in memory; JWT is self-contained.
        // passwordResetTokens[token] = { email, expires: Date.now() + 15 * 60 * 1000 };

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:10301'}/reset-password?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'trasmileniopruebas@gmail.com',
                pass: process.env.EMAIL_PASS || 'nhbrvpeyyljakcze' 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'trasmileniopruebas@gmail.com',
            to: email,
            subject: 'Recuperación de contraseña',
            text: `Haz clic en el siguiente enlace para cambiar tu contraseña (válido por 15 minutos): ${resetLink}`,
            html: `<p>Haz clic en el siguiente enlace para cambiar tu contraseña (válido por 15 minutos): <a href="${resetLink}">${resetLink}</a></p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Enlace de recuperación enviado al correo' });

    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        res.status(500).json({ error: 'No se pudo enviar el correo de recuperación' });
    }
});

// Endpoint para cambiar la contraseña usando el token JWT
router.post('/usuarios/reset-password', async (req, res) => {
    const { token, nuevaContraseña } = req.body;
    if (!token || !nuevaContraseña) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });

    try {
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_RESET_SECRET || 'your_default_jwt_reset_secret');
        } catch (jwtError) {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }

        if (decodedToken.purpose !== 'password-reset') {
            return res.status(401).json({ error: 'Token no válido para esta operación.' });
        }

        const email = decodedToken.email;

        // Check if user still exists (though unlikely to be deleted between token generation and use)
        const userQuery = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
        const updateResult = await db.query('UPDATE usuarios SET contraseña = $1 WHERE email = $2', [hashedPassword, email]);

        if (updateResult.rowCount === 0) {
            // This case should ideally not be reached if the user was found above.
            return res.status(500).json({ error: 'No se pudo cambiar la contraseña. Usuario no encontrado después de la verificación del token.' });
        }
        
        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
});

module.exports = router;