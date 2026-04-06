const express = require('express');
const router = express.Router();
const ViewHistory = require('../models/ViewHistory');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/history
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await ViewHistory.findByUserId(userId);
        res.json({ success: true, data: history });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar histórico.' });
    }
});

module.exports = router;
