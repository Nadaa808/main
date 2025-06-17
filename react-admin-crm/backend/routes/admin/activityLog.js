const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authorizeRoles } = require('../../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Restrict to ADMIN role
router.use(authorizeRoles('ADMIN'));

/**
 * Get recent activity logs
 * GET /api/admin/activity-log
 * Query params:
 *   limit (default 50)
 */
router.get('/', async(req, res) => {
    try {
        const { limit = 50 } = req.query;
        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Activity log fetch error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;