const express = require('express');
const inventoryController = require('../controllers/inventory.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { stockInPhysicalSchema, stockInDigitalSchema } = require('../middlewares/validators/inventory.validator');

const router = express.Router();

// Tất cả route kho yêu cầu đăng nhập và role admin hoặc staff
router.use(authenticate, authorizeRoles(['admin', 'staff']));

// ── Nhập kho ───────────────────────────────────────────────────────────────
// POST /api/v1/inventory/stock-in/physical/:productId
router.post(
    '/stock-in/physical/:productId',
    validate(stockInPhysicalSchema),
    (req, res, next) => inventoryController.stockInPhysical(req, res, next)
);

// POST /api/v1/inventory/stock-in/digital/:productId
router.post(
    '/stock-in/digital/:productId',
    validate(stockInDigitalSchema),
    (req, res, next) => inventoryController.stockInDigital(req, res, next)
);

// ── Xem tồn kho ────────────────────────────────────────────────────────────
// GET /api/v1/inventory/stock?product_type=physical&search=macbook&page=1&limit=10
router.get(
    '/stock',
    (req, res, next) => inventoryController.getStockSummary(req, res, next)
);

// ── Cảnh báo hàng sắp hết ─────────────────────────────────────────────────
// GET /api/v1/inventory/low-stock?threshold=5&product_type=physical
router.get(
    '/low-stock',
    (req, res, next) => inventoryController.getLowStockAlerts(req, res, next)
);

// ── Lịch sử nhập/xuất kho ──────────────────────────────────────────────────
// GET /api/v1/inventory/logs?product_id=xxx&action=stock_in&from=2024-01-01&to=2024-12-31
router.get(
    '/logs',
    (req, res, next) => inventoryController.getInventoryLogs(req, res, next)
);

module.exports = router;