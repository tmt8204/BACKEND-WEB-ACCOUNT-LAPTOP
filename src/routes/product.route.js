const express = require("express");
const productController = require("../controllers/product.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { createPhysicalProductSchema } = require("../middlewares/validators/product.validator");

const router = express.Router();

router.post("/create-physical", authenticate, authorizeRoles(['admin', 'staff']), validate(createPhysicalProductSchema), (req, res, next) => {
    productController.createPhysicalProduct(req, res, next);
});

module.exports = router;