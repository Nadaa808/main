const express = require('express');
const { PrismaClient } = require('@prisma/client');
const SumsubService = require('../../services/sumsubService');

const router = express.Router();
const prisma = new PrismaClient();
const sumsubService = new SumsubService();

/**
 * Get all KYC submissions with filters (Admin Dashboard)
 * GET /api/admin/kyc/submissions
 */
router.get('/submissions', async(req, res) => {
    try {
        const {
            status,
            page = 1,
            limit = 20,
            search,
            submissionType,
            verificationType
        } = req.query;

        // Build filter conditions
        const where = {};

        if (status) {
            where.status = status;
        }

        if (submissionType) {
            where.submissionType = submissionType;
        }

        if (verificationType) {
            where.verificationType = verificationType;
        }

        if (search) {
            where.OR = [{
                    user: {
                        email: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    user: {
                        firstName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    user: {
                        lastName: {
                            contains: search,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [submissions, totalCount] = await Promise.all([
            prisma.kYCSubmission.findMany({
                where,
                include: {
                    user: true,
                    statusHistory: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.kYCSubmission.count({ where })
        ]);

        // Stats
        const stats = await prisma.kYCSubmission.groupBy({
            by: ['status'],
            _count: { status: true }
        });

        const statusStats = stats.reduce((acc, s) => {
            acc[s.status] = s._count.status;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                submissions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                },
                stats: statusStats
            }
        });
    } catch (error) {
        console.error('Get Admin Submissions Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get detailed submission info for admin review
 * GET /api/admin/kyc/submission/:submissionId
 */
router.get('/submission/:submissionId', async(req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await prisma.kYCSubmission.findUnique({
            where: { id: submissionId },
            include: {
                user: true,
                statusHistory: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        // Pull Sumsub data if applicant ID exists
        let sumsubData = null;
        if (submission.sumsubApplicantId) {
            const sumsubResult = await sumsubService.getApplicantData(submission.sumsubApplicantId);
            if (sumsubResult.success) sumsubData = sumsubResult.data;
        }

        res.json({ success: true, data: { submission, sumsubData } });
    } catch (error) {
        console.error('Get Submission Details Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Approve KYC submission (Admin Override)
 * POST /api/admin/kyc/submission/:submissionId/approve
 */
router.post('/submission/:submissionId/approve', async(req, res) => {
    try {
        const { submissionId } = req.params;
        const { reason, adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ success: false, error: 'Admin ID is required' });
        }

        const submission = await prisma.kYCSubmission.findUnique({
            where: { id: submissionId },
            include: { user: true }
        });

        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        // Update submission
        const updatedSubmission = await prisma.kYCSubmission.update({
            where: { id: submissionId },
            data: {
                status: 'APPROVED',
                verificationType: 'MANUAL',
                verifiedBy: adminId,
                verifiedAt: new Date(),
                rejectionReason: null,
                updatedAt: new Date()
            }
        });

        // Add status history record
        await prisma.kYCStatusHistory.create({
            data: {
                submissionId,
                previousStatus: submission.status,
                newStatus: 'APPROVED',
                verificationType: 'MANUAL',
                verifiedBy: adminId,
                reason: reason || 'Manually approved by admin'
            }
        });

        // TODO: Blockchain integration (SBT minting, etc.)

        res.json({
            success: true,
            data: {
                submissionId,
                previousStatus: submission.status,
                newStatus: 'APPROVED',
                verifiedBy: adminId,
                verifiedAt: updatedSubmission.verifiedAt
            }
        });
    } catch (error) {
        console.error('Approve Submission Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Reject KYC submission (Admin Override)
 * POST /api/admin/kyc/submission/:submissionId/reject
 */
router.post('/submission/:submissionId/reject', async(req, res) => {
    try {
        const { submissionId } = req.params;
        const { reason, adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({ success: false, error: 'Admin ID is required' });
        }

        if (!reason) {
            return res.status(400).json({ success: false, error: 'Rejection reason is required' });
        }

        const submission = await prisma.kYCSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) {
            return res.status(404).json({ success: false, error: 'Submission not found' });
        }

        await prisma.kYCSubmission.update({
            where: { id: submissionId },
            data: {
                status: 'REJECTED',
                verificationType: 'MANUAL',
                verifiedBy: adminId,
                verifiedAt: null,
                rejectionReason: reason,
                updatedAt: new Date()
            }
        });

        await prisma.kYCStatusHistory.create({
            data: {
                submissionId,
                previousStatus: submission.status,
                newStatus: 'REJECTED',
                verificationType: 'MANUAL',
                verifiedBy: adminId,
                reason
            }
        });

        res.json({
            success: true,
            data: {
                submissionId,
                previousStatus: submission.status,
                newStatus: 'REJECTED',
                verifiedBy: adminId,
                rejectedAt: new Date(),
                reason
            }
        });
    } catch (error) {
        console.error('Reject Submission Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;