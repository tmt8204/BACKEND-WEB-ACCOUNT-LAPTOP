const cartService = require('../services/cart.service');
const ApiResponse = require('../utils/api.response');

class CartController {

    async getCart(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await cartService.getCartByUserId(userId);

            return res.status(200).json(
                ApiResponse.success(200, 'Lấy giỏ hàng thành công', result)
            );
        } catch (error) {
            throw error;
        }
    }

    async addItem(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await cartService.addItemToCart(userId, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Thêm sản phẩm vào giỏ hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
 
    async updateItemQuantity(req, res, next) {
        try {
            const userId = req.user.id;
            const { cartItemId } = req.params;
            const { quantity } = req.body;
            const result = await cartService.updateItemQuantity(userId, cartItemId, quantity);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật số lượng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
 
    async removeItem(req, res, next) {
        try {
            const userId = req.user.id;
            const { cartItemId } = req.params;
            const result = await cartService.removeItem(userId, cartItemId);
            return res.status(200).json(
                ApiResponse.success(200, 'Xóa sản phẩm khỏi giỏ hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
 
    async clearCart(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await cartService.clearCart(userId);
            return res.status(200).json(
                ApiResponse.success(200, 'Xóa toàn bộ giỏ hàng thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CartController();