const Cart = require('../models/cart.model');

class CartRepository {

    async findCartByUserId(userId) {
        try {
            return await Cart.findOne({ user_id: userId })
                .populate({
                    path: 'items.product_id',
                    select: 'name base_price product_type status is_active'
                });
        } catch (error) {
            throw error;
        }
    }

    async createCart(userId) {
        try {
            const cart = new Cart({ user_id: userId, items: [] });
            return await cart.save();
        } catch (error) {
            throw error;
        }
    }

    async addItemToCart(userId, item) {
        try {
            // BUG FIX: thiếu return ở đây
            const cart = await Cart.findOneAndUpdate(
                { user_id: userId },
                { $push: { items: item } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status is_active'
            });
            return cart; // <-- đã thêm return
        } catch (error) {
            throw error;
        }
    }

    async updateCartItem(userId, itemId, quantity) {
        try {
            return await Cart.findOneAndUpdate(
                { user_id: userId, 'items._id': itemId },
                { $set: { 'items.$.quantity': quantity } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status is_active'
            });
        } catch (error) {
            throw error;
        }
    }

    async removeItemFromCart(userId, itemId) {
        try {
            return await Cart.findOneAndUpdate(
                { user_id: userId },
                { $pull: { items: { _id: itemId } } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status is_active'
            });
        } catch (error) {
            throw error;
        }
    }

    async clearCart(userId, session = null) {
        try {
            const options = session ? { new: true, session } : { new: true };
            return await Cart.findOneAndUpdate(
                { user_id: userId },
                { $set: { items: [] } },
                options
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new CartRepository();