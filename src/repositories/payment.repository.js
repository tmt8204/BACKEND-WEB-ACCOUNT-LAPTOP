const Payment = require('../models/payment.model');

class PaymentRepository {
    async createPayment(paymentData, session = null) {
        try {
            const options = session ? { session } : {};
            const [payment] = await Payment.create([paymentData], options);
            return payment;
        } catch (error) {
            throw error;
        }
    }

    async findPaymentById(paymentId) {
        try {
            return await Payment.findById(paymentId).populate('order_id');
        } catch (error) {
            throw error;
        }
    }

    async findPaymentByOrderId(orderId) {
        try {
            return await Payment.findOne({ order_id: orderId });
        } catch (error) {
            throw error;
        }
    }

    // SePay webhook sẽ match theo transfer_content
    async findPaymentByTransferContent(transferContent) {
        try {
            return await Payment.findOne({ transfer_content: transferContent });
        } catch (error) {
            throw error;
        }
    }

    async updatePayment(paymentId, updateData, session = null) {
        try {
            const options = session ? { new: true, session } : { new: true };
            return await Payment.findByIdAndUpdate(paymentId, updateData, options);
        } catch (error) {
            throw error;
        }
    }

    // Tìm payment pending đã hết hạn (dùng cho cron job)
    async findExpiredPendingPayments() {
        try {
            return await Payment.find({
                status: 'pending',
                method: 'bank_transfer',
                expires_at: { $lt: new Date() }
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new PaymentRepository();