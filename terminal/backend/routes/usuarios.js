const express = require('express');
const router = express.Router();
const db = require('../db/conecction');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.use(express.json()); // Middleware para parsear JSON

// Almacén temporal de códigos de verificación (en memoria, para demo)
const verificationCodes = {};

// Almacén temporal de tokens de recuperación (en memoria, para demo)
const passwordResetTokens = {};

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        db.all('SELECT * FROM usuarios', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener los usuarios' });
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

// Obtener un usuario por ID
router.get('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM usuarios WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener el usuario' });
            } else if (!row) {
                res.status(404).json({ error: 'Usuario no encontrado' });
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// Crear un nuevo usuario (ahora inicia como no verificado)
router.post('/usuarios', async (req, res) => {
    const { nombre, email, contraseña } = req.body;
    const rol_id = 3; // Asignar rol por defecto
    try {
        const hashedPassword = await bcrypt.hash(contraseña, 10); // Hashear la contraseña
        db.run(
            'INSERT INTO usuarios (nombre, email, contraseña, rol_id, verificado) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, hashedPassword, rol_id, 0],
            function (err) {
                if (err) {
                    console.error('Error al crear el usuario:', err);
                    res.status(500).json({ error: 'Error al crear el usuario' });
                } else {
                    res.status(201).json({ id: this.lastID, nombre, email, rol_id, verificado: 0 });
                }
            }
        );
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

// Actualizar un usuario por ID
router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, contraseña, rol_id } = req.body;
    try {
        db.run(
            'UPDATE usuarios SET nombre = ?, email = ?, contraseña = ?, rol_id = ? WHERE id = ?',
            [nombre, email, contraseña, rol_id, id],
            function (err) {
                if (err) {
                    res.status(500).json({ error: 'Error al actualizar el usuario' });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Usuario no encontrado' });
                } else {
                    res.json({ id, nombre, email, rol_id });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
});

// Eliminar un usuario por ID
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run('DELETE FROM usuarios WHERE id = ?', [id], function (err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar el usuario' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Usuario no encontrado' });
            } else {
                res.json({ message: 'Usuario eliminado' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// Endpoint para inicio de sesión (solo si está verificado)
router.post('/usuarios/login', async (req, res) => {
    const { email, contraseña } = req.body;
    try {
        db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
            if (err) {
                res.status(500).json({ error: 'Error al iniciar sesión' });
            } else if (!usuario) {
                res.status(404).json({ error: 'Usuario no encontrado' });
            } else if (!usuario.verificado) {
                res.status(401).json({ error: 'Debes verificar tu correo antes de iniciar sesión.' });
            } else {
                const isPasswordValid = await bcrypt.compare(contraseña, usuario.contraseña);
                if (!isPasswordValid) {
                    res.status(401).json({ error: 'Contraseña incorrecta' });
                } else {
                    // Generar token JWT
                    const token = jwt.sign(
                        { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol_id: usuario.rol_id }, 
                        'SECRET_KEY',
                        { expiresIn: '1h' }
                    );
                    res.json({
                        message: 'Inicio de sesión exitoso',
                        token,
                        user: {
                            id: usuario.id,
                            nombre: usuario.nombre,
                            email: usuario.email,
                            rol_id: usuario.rol_id // <--- agrega rol_id al usuario devuelto
                        }
                    });
                }
            }
        });
    } catch (error) {
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
    if (!entry) return res.status(400).json({ error: 'No se ha solicitado código para este correo' });
    if (entry.expires < Date.now()) return res.status(400).json({ error: 'El código ha expirado' });

    if (entry.code === code) {
        // Marcar usuario como verificado en la base de datos
        db.run('UPDATE usuarios SET verificado = 1 WHERE email = ?', [email], function (err) {
            delete verificationCodes[email];
            if (err) {
                return res.status(500).json({ error: 'No se pudo actualizar el usuario como verificado' });
            }
            return res.json({ message: 'Código verificado correctamente' });
        });
    } else {
        return res.status(400).json({ error: 'Código incorrecto' });
    }
});

// Endpoint para enviar link de recuperación de contraseña
router.post('/usuarios/enviar-recuperacion', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    // Verifica que el usuario exista y esté verificado
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, usuario) => {
        if (err || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!usuario.verificado) {
            return res.status(401).json({ error: 'El usuario no está verificado' });
        }

        // Genera un token único (válido por 15 minutos)
        const token = Math.random().toString(36).substr(2) + Date.now();
        passwordResetTokens[token] = { email, expires: Date.now() + 15 * 60 * 1000 };

        // Link de recuperación (ajusta la URL según tu frontend)
        const resetLink = `http://localhost:10301/reset-password?token=${token}`;

        // Configura tu transporte de nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'trasmileniopruebas@gmail.com',
                pass: 'nhbrvpeyyljakcze'
            }
        });

        const mailOptions = {
            from: 'trasmileniopruebas@gmail.com',
            to: email,
            subject: 'Recuperación de contraseña',
            text: `Haz clic en el siguiente enlace para cambiar tu contraseña (válido por 15 minutos): ${resetLink}`
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ message: 'Enlace de recuperación enviado al correo' });
        } catch (error) {
            console.error('Error al enviar correo:', error);
            res.status(500).json({ error: 'No se pudo enviar el correo' });
        }
    });
});

// Endpoint para cambiar la contraseña usando el token
router.post('/usuarios/reset-password', async (req, res) => {
    const { token, nuevaContraseña } = req.body;
    if (!token || !nuevaContraseña) return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });

    const entry = passwordResetTokens[token];
    if (!entry) return res.status(400).json({ error: 'Token inválido o expirado' });
    if (entry.expires < Date.now()) {
        delete passwordResetTokens[token];
        return res.status(400).json({ error: 'Token expirado' });
    }

    // Cambia la contraseña
    const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
    db.run('UPDATE usuarios SET contraseña = ? WHERE email = ?', [hashedPassword, entry.email], function (err) {
        delete passwordResetTokens[token];
        if (err) {
            return res.status(500).json({ error: 'No se pudo cambiar la contraseña' });
        }
        return res.json({ message: 'Contraseña actualizada correctamente' });
    });
});

module.exports = router;