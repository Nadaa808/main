const crypto = require('crypto');
const axios = require('axios');

class SumsubService {
    constructor() {
        this.baseURL = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
        this.appToken = process.env.SUMSUB_APP_TOKEN;
        this.secretKey = process.env.SUMSUB_SECRET_KEY;
        this.webhookSecret = process.env.SUMSUB_WEBHOOK_SECRET || this.secretKey;
        this.levelName = process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level';
    }

    /**
     * Generate HMAC signature for Sumsub API requests
     */
    generateSignature(method, url, body = '') {
        const timestamp = Math.floor(Date.now() / 1000);
        const message = timestamp + method.toUpperCase() + url + body;
        const signature = crypto.createHmac('sha256', this.secretKey)
            .update(message)
            .digest('hex');

        return {
            signature,
            timestamp
        };
    }

    /**
     * Make authenticated request to Sumsub API
     */
    async makeRequest(method, endpoint, data = null) {
        const url = endpoint;
        const body = data ? JSON.stringify(data) : '';
        const { signature, timestamp } = this.generateSignature(method, url, body);

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-App-Token': this.appToken,
            'X-App-Access-Sig': signature,
            'X-App-Access-Ts': timestamp
        };

        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${url}`,
                headers,
                data: data || undefined
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Sumsub API Error:', (error.response && error.response.data) || error.message);
            return {
                success: false,
                error: (error.response && error.response.data) || error.message,
                status: error.response ? error.response.status : undefined
            };
        }
    }

    /**
     * Create a new applicant in Sumsub
     */
    async createApplicant(userData) {
        const applicantData = {
            externalUserId: userData.userId,
            info: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                ...(userData.email && { email: userData.email }),
                ...(userData.phone && { phone: userData.phone })
            },
            ...(userData.type && { type: userData.type }) // 'individual' or 'company'
        };

        const result = await this.makeRequest('POST', '/resources/applicants', applicantData);

        if (result.success) {
            // Generate access token for the applicant
            const tokenResult = await this.generateAccessToken(result.data.id, this.levelName);

            return {
                success: true,
                applicantId: result.data.id,
                token: tokenResult.success ? tokenResult.data.token : null,
                data: result.data
            };
        }

        return result;
    }

    /**
     * Generate access token for frontend KYC widget
     */
    async generateAccessToken(applicantId, levelName = null) {
        const level = levelName || this.levelName;
        const endpoint = `/resources/accessTokens?userId=${applicantId}&levelName=${level}`;

        return await this.makeRequest('POST', endpoint);
    }

    /**
     * Get applicant status and details
     */
    async getApplicantStatus(applicantId) {
        const result = await this.makeRequest('GET', `/resources/applicants/${applicantId}/status`);

        if (result.success) {
            return {
                success: true,
                status: this.mapSumsubStatus(result.data.reviewStatus),
                sumsubStatus: result.data.reviewStatus,
                reviewResult: result.data.reviewResult,
                data: result.data
            };
        }

        return result;
    }

    /**
     * Get full applicant data
     */
    async getApplicantData(applicantId) {
        return await this.makeRequest('GET', `/resources/applicants/${applicantId}/one`);
    }

    /**
     * Reset applicant (for resubmission)
     */
    async resetApplicant(applicantId) {
        return await this.makeRequest('POST', `/resources/applicants/${applicantId}/reset`);
    }

    /**
     * Map Sumsub status to our internal KYC status
     */
    mapSumsubStatus(sumsubStatus) {
        const statusMap = {
            'init': 'PENDING',
            'pending': 'PENDING',
            'queued': 'IN_REVIEW',
            'completed': 'APPROVED',
            'onHold': 'IN_REVIEW',
            'rejected': 'REJECTED',
            'temporarilyDeclined': 'RESUBMISSION_REQUIRED'
        };

        return statusMap[sumsubStatus] || 'PENDING';
    }

    /**
     * Verify webhook signature
     */
    verifyWebhook(payload, signature) {
        const expectedSignature = crypto.createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Process webhook payload
     */
    processWebhook(payload) {
        try {
            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;

            return {
                success: true,
                applicantId: data.applicantId,
                externalUserId: data.externalUserId,
                reviewStatus: data.reviewStatus,
                reviewResult: data.reviewResult,
                status: this.mapSumsubStatus(data.reviewStatus),
                type: data.type, // applicantReviewed, applicantPending, etc.
                createdAt: data.createdAt
            };
        } catch (error) {
            return {
                success: false,
                error: 'Invalid webhook payload'
            };
        }
    }

    /**
     * Resync applicant data from Sumsub
     */
    async resyncApplicant(applicantId) {
        const [statusResult, dataResult] = await Promise.all([
            this.getApplicantStatus(applicantId),
            this.getApplicantData(applicantId)
        ]);

        if (statusResult.success && dataResult.success) {
            return {
                success: true,
                status: statusResult.status,
                sumsubStatus: statusResult.sumsubStatus,
                reviewResult: statusResult.reviewResult,
                applicantData: dataResult.data,
                lastSync: new Date()
            };
        }

        return {
            success: false,
            error: 'Failed to resync applicant data'
        };
    }
}

module.exports = SumsubService;