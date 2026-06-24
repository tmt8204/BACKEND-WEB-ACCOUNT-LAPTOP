const inventoryService = require('../services/inventory.service');
const ApiResponse = require('../utils/api.response');

class InventoryController {

    // ── 1. Nhập kho ──────────────────────────────────────────────────────────

    /**
     * POST /api/v1/inventory/stock-in/physical/:productId
     */
    async stockInPhysical(req, res, next) {
        try {
            const staffId   = req.user.id;
            const { productId } = req.params;
            const { note, ...itemData } = req.body;

            const result = await inventoryService.stockInPhysical(productId, itemData, staffId, note);

            return res.status(201).json(
                ApiResponse.success(201, 'Nhập kho sản phẩm vật lý thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/inventory/stock-in/digital/:productId
     */
    async stockInDigital(req, res, next) {
        try {
            const staffId   = req.user.id;
            const { productId } = req.params;
            const { note, ...itemData } = req.body;

            const result = await inventoryService.stockInDigital(productId, itemData, staffId, note);

            return res.status(201).json(
                ApiResponse.success(201, 'Nhập kho sản phẩm kỹ thuật số thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── 2. Xem tồn kho ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/inventory/stock
     * Query: product_type, search, page, limit
     */
    async getStockSummary(req, res, next) {
        try {
            const { product_type, search, page, limit } = req.query;

            const result = await inventoryService.getStockSummary({ product_type, search, page, limit });

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin tồn kho thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── 3. Cảnh báo hàng sắp hết ─────────────────────────────────────────────

    /**
     * GET /api/v1/inventory/low-stock
     * Query: threshold (default 3), product_type
     */
    async getLowStockAlerts(req, res, next) {
        try {
            const { threshold, product_type } = req.query;

            const result = await inventoryService.getLowStockAlerts({ threshold, product_type });

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách hàng sắp hết thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ── 4. Lịch sử nhập/xuất kho ─────────────────────────────────────────────

    /**
     * GET /api/v1/inventory/logs
     * Query: product_id, action, product_type, from, to, created_by, page, limit
     */
    async getInventoryLogs(req, res, next) {
        try {
            const { product_id, action, product_type, from, to, created_by, page, limit } = req.query;

            const result = await inventoryService.getInventoryLogs({
                product_id, action, product_type, from, to, created_by, page, limit
            });

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy lịch sử kho thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new InventoryController();