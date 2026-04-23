const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(400).json({ error: error.message || 'Error al registrar usuario' });
    }
});

const auth = require('../middleware/auth');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, username: user.username, isVerified: user.isVerified });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

/**
 * PUT /api/auth/username
 * Actualiza el nombre de usuario del usuario autenticado.
 */
router.put('/username', auth, async (req, res) => {
    try {
        const { newUsername } = req.body;
        if (!newUsername || newUsername.trim().length < 3) {
            return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
        }

        // Verificar si el nombre ya existe
        const existing = await User.findOne({ username: newUsername.trim() });
        if (existing) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { username: newUsername.trim() },
            { returnDocument: 'after' }
        );

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Nombre de usuario actualizado', username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el nombre de usuario' });
    }
});

/**
 * POST /api/auth/follow/:userId
 * Sigue o deja de seguir a un usuario.
 */
router.post('/follow/:id', auth, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        if (!userToFollow) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (userToFollow._id.toString() === req.userId) return res.status(400).json({ error: 'No podés seguirte a vos mismo' });

        const isFollowing = userToFollow.followers.includes(req.userId);
        
        if (isFollowing) {
            userToFollow.followers = userToFollow.followers.filter(f => f.toString() !== req.userId);
            await userToFollow.save();
            res.json({ message: 'Dejaste de seguir al usuario', isFollowing: false });
        } else {
            userToFollow.followers.push(req.userId);
            await userToFollow.save();
            res.json({ message: 'Siguiendo al usuario', isFollowing: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar seguimiento' });
    }
});

module.exports = router;
