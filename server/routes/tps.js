const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const TP = require('../models/TP');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Middleware to authenticate
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No autorizado' });
    
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

router.get('/', auth, async (req, res) => {
    try {
        const tps = await TP.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json(tps);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener TPs' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, description, status, dueDate } = req.body;
        const tp = new TP({ title, description, status, dueDate, user: req.userId });
        await tp.save();
        res.status(201).json(tp);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear TP' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, status, dueDate } = req.body;
        // Use $set to only update provided fields if needed, 
        // but here we just pass the object
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        const tp = await TP.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        if (!tp) return res.status(404).json({ error: 'TP no encontrado' });
        res.json(tp);
    } catch (error) {
        console.error('Error al actualizar TP:', error);
        res.status(400).json({ error: 'Error al actualizar TP' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const tp = await TP.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!tp) return res.status(404).json({ error: 'TP no encontrado' });
        res.json({ message: 'TP eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar TP' });
    }
});

/**
 * GET /api/tps/ranking
 * Ranking público de usuarios con más TPs.
 * Devuelve: username, total de TPs, y desglose por estado.
 * No requiere autenticación.
 */
router.get('/ranking', async (req, res) => {
    try {
        const ranking = await TP.aggregate([
            {
                $group: {
                    _id: '$user',
                    total: { $sum: 1 },
                    presentar: {
                        $sum: { $cond: [{ $eq: ['$status', 'Presentar'] }, 1, 0] }
                    },
                    entregar: {
                        $sum: { $cond: [{ $eq: ['$status', 'Entregar'] }, 1, 0] }
                    },
                    finalizado: {
                        $sum: { $cond: [{ $eq: ['$status', 'Finalizado'] }, 1, 0] }
                    }
                }
            },
            { $sort: { finalizado: -1, total: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 0,
                    username: '$userInfo.username',
                    total: 1,
                    presentar: 1,
                    entregar: 1,
                    finalizado: 1
                }
            }
        ]);

        res.json(ranking);
    } catch (error) {
        console.error('Error en ranking:', error);
        res.status(500).json({ error: 'Error al obtener ranking' });
    }
});

module.exports = router;
