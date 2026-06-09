const express = require("express");
const productController = require("../controllers/product.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
    createPhysicalProductSchema,
    createDigitalProductSchema,
    updatePhysicalProductSchema,
    updateDigitalProductSchema,
    updatePhysicalItemSchema,
    updateDigitalItemSchema
} = require("../middlewares/validators/product.validator");

const router = express.Router();

// ───────────────────────── READ (public) ─────────────────────────
router.get("/", (req, res, next) => {
    productController.getAllProducts(req, res, next);
});

router.get("/:id", (req, res, next) => {
    productController.getProductById(req, res, next);
});

// ───────────────────────── CREATE (admin / staff) ─────────────────────────
router.post(
    "/create-physical",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(createPhysicalProductSchema),
    (req, res, next) => productController.createPhysicalProduct(req, res, next)
);

router.post(
    "/create-digital",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(createDigitalProductSchema),
    (req, res, next) => productController.createDigitalProduct(req, res, next)
);

// ───────────────────────── UPDATE (admin / staff) ─────────────────────────
router.put(
    "/physical/:id",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(updatePhysicalProductSchema),
    (req, res, next) => productController.updatePhysicalProduct(req, res, next)
);

router.put(
    "/digital/:id",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(updateDigitalProductSchema),
    (req, res, next) => productController.updateDigitalProduct(req, res, next)
);

router.put(
    "/physical/item/:itemId",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(updatePhysicalItemSchema),
    (req, res, next) => productController.updatePhysicalItem(req, res, next)
);

router.put(
    "/digital/item/:itemId",
    authenticate, authorizeRoles(['admin', 'staff']),
    validate(updateDigitalItemSchema),
    (req, res, next) => productController.updateDigitalItem(req, res, next)
);

// ───────────────────────── DELETE (admin only) ─────────────────────────

/** Soft-delete: ẩn sản phẩm */
router.patch(
    "/:id/deactivate",
    authenticate, authorizeRoles(['admin']),
    (req, res, next) => productController.softDeleteProduct(req, res, next)
);

/** Hard-delete: xoá hẳn */
router.delete(
    "/:id",
    authenticate, authorizeRoles(['admin']),
    (req, res, next) => productController.hardDeleteProduct(req, res, next)
);

module.exports = router;