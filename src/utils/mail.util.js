const nodemailer = require('nodemailer');

class MailUtil {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
    }

    async sendOTP(email, otp) {
        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_USER,
                to: email,
                subject: "OTP Verification",
                html: `
                    <h2>Your OTP Code</h2>
                    <h1>${otp}</h1>
                    <p>OTP expires in 5 minutes.</p>
                `
            });

            console.log(`OTP sent to ${email}`);

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MailUtil();