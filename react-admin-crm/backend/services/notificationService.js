const nodemailer = require('nodemailer');
const { Server } = require('socket.io');

class NotificationService {
    constructor(httpServer) {
        /* e-mail ---------------------------------------------------- */
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        /* realtime -------------------------------------------------- */
        this.io = new Server(httpServer, {
            cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' }
        });
    }

    email(to, subject, html) {
        return this.transporter.sendMail({
            from: `"RWA-Admin" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
    }

    push(event, payload) {
        this.io.emit(event, payload); // broadcast to all admins
    }
}

module.exports = NotificationService;