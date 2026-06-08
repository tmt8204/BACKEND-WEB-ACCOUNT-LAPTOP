const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/api.response');

class PaymentController {

    /**
     * GET /api/v1/payment/order/:orderId
     * Lấy thông tin thanh toán của một order (dùng để hiển thị QR / thông tin CK).
     */
    async getPaymentInfo(req, res, next) {
        try {
            const userId = req.user.id;
            const { orderId } = req.params;

            const payment = await paymentService.getPaymentByOrder(orderId, userId);

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin thanh toán thành công', payment)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/payment/webhook/sepay
     * SePay sẽ POST về đây khi phát hiện giao dịch.
     * Endpoint này KHÔNG cần authenticate (SePay gọi từ server).
     * Bảo vệ bằng SEPAY_WEBHOOK_TOKEN trong header.
     */
    async sePayWebhook(req, res, next) {
        try {
            // Xác thực webhook token từ SePay

            console.log("=== WEBHOOK CALLED ===");
            console.log(req.headers);
            console.log(req.body);
            
            const webhookToken = req.headers['authorization'];
            const expectedToken = `Apikey ${process.env.SEPAY_WEBHOOK_TOKEN}`;

            console.log("ALL HEADERS:");
            console.log(req.headers);
            console.log("BODY:");
            console.log(req.body);
            if (!webhookToken || webhookToken !== expectedToken) {
                return res.status(401).json(
                    ApiResponse.error(401, 'Webhook token không hợp lệ', 'Unauthorized')
                );
            }

            const result = await paymentService.handleSePayWebhook(req.body);

            // SePay yêu cầu trả về HTTP 200 với success: true
            return res.status(200).json({ success: result.success, message: result.message });
        } catch (error) {
            // Vẫn trả 200 để SePay không retry liên tục — log lỗi thay vì throw
            console.error('[SePay Webhook Error]', error.message);
            return res.status(200).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/v1/payment/cod/confirm/:orderId
     * Staff xác nhận đã nhận tiền COD.
     */
    async confirmCOD(req, res, next) {
        try {
            const staffId = req.user.id;
            const { orderId } = req.params;

            const result = await paymentService.confirmCOD(orderId, staffId);

            return res.status(200).json(
                ApiResponse.success(200, 'Xác nhận COD thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PaymentController();