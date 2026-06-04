const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authenticate, authorizeRoles} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { addCartItemSchema, updateCartItemSchema } = require('../middlewares/validators/cart.validator');

const router = express.Router();

// All cart routes require authentication (customer only)
router.use(authenticate, authorizeRoles(['customer']));
 
// GET /api/v1/cart — get current user's cart
router.get('/', (req, res, next) => {
    cartController.getCart(req, res, next);
});
 
// POST /api/v1/cart/add — add item to cart
router.post('/add', validate(addCartItemSchema), (req, res, next) => {
    cartController.addItem(req, res, next);
});
 
// PUT /api/v1/cart/item/:cartItemId — update item quantity
router.put('/item/:cartItemId', validate(updateCartItemSchema), (req, res, next) => {
    cartController.updateItemQuantity(req, res, next);
});
 
// DELETE /api/v1/cart/item/:cartItemId — remove single item
router.delete('/item/:cartItemId', (req, res, next) => {
    cartController.removeItem(req, res, next);
});
 
// DELETE /api/v1/cart — clear entire cart
router.delete('/', (req, res, next) => {
    cartController.clearCart(req, res, next);
});
 
module.exports = router;