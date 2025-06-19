const express = require('express');
const SumsubService = require('../services/sumsubService');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const sumsubService = new SumsubService();

/**
 * Sumsub webhook receiver
 * This route is parsed with express.raw() in index.js so req.body is a Buffer.
 */
router.post('/webhook', async(req, res) => {
    try {
        const signature = req.headers['x-payload-digest'];
        const payload = req.body.toString('utf8');

        // Verify webhook signature
        if (!sumsubService.verifyWebhook(payload, signature)) {
            return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        const parsed = sumsubService.processWebhook(payload);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error });
        }

        // Upsert submission status in DB (simplified example)
        await prisma.kYCSubmission.updateMany({
            where: { sumsubApplicantId: parsed.applicantId },
            data: {
                status: parsed.status,
                updatedAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Webhook handling error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get applicant status (client polling helper)
 */
router.get('/status/:applicantId', async(req, res) => {
    try {
        const { applicantId } = req.params;
        const result = await sumsubService.getApplicantStatus(applicantId);
        if (result.success) return res.json(result);
        res.status(400).json(result);
    } catch (err) {
        console.error('Get applicant status error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Endpoint to create Sumsub applicant and return widget token
router.post('/applicant', authenticateToken, async(req, res) => {
    try {
        const user = req.user; // extracted from JWT by auth middleware

        const applicantData = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phoneNumber,
            type: 'individual'
        };

        const result = await sumsubService.createApplicant(applicantData);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error || 'Failed to create applicant' });
        }

        // Persist applicantId & token on submission record? (optional)
        await prisma.kYCSubmission.create({
            data: {
                userId: user.id,
                submissionType: 'KYC',
                status: 'PENDING',
                sumsubApplicantId: result.applicantId,
                sumsubToken: result.token
            }
        });

        res.json({ success: true, applicantId: result.applicantId, token: result.token });
    } catch (error) {
        console.error('Create applicant error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;