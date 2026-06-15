const Cart = require('../models/cart.model');

class CartRepository {

    // Find cart by user ID
    async findCartByUserId(userId) {
        try {
            // Find the cart document for the given user ID and populate the product details for each item
            return await Cart.findOne({ user_id: userId })
                .populate({
                    path: 'items.product_id',
                    select: 'name base_price product_type status'
                });
        } catch (error) {
            throw error;
        }
    }

    // Create a new cart for a user
    async createCart(userId) {
        try {
            // Create a new cart document for the user with an empty items array
            const cart = new Cart({ user_id: userId, items: [] });

            return await cart.save();
        } catch (error) {
            throw error;
        }
    }

    // Add item to cart
    async addItemToCart(userId, item) {
        try {
            // Use findOneAndUpdate to add the item to the cart and return the updated cart
            const cart = await Cart.findOneAndUpdate(
                { user_id: userId },
                { $push: { items: item } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status'
            });
        } catch (error) {
            throw error;
        }
    }

    // Update item quantity in cart
    async updateCartItem(userId, itemId, quantity) {
        try {
            return await Cart.findOneAndUpdate(
                { user_id: userId, 'items._id': itemId },
                { $set: { 'items.$.quantity': quantity } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status'
            });
        } catch (error) {
            throw error;
        }
    }

    // Remove item from cart
    async removeItemFromCart(userId, itemId) {
        try {
            return await Cart.findOneAndUpdate(
                { user_id: userId },
                { $pull: { items: { _id: itemId } } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status'
            });
        } catch (error) {
            throw error;
        }
    }

    // Clear cart
    async clearCart(userId) {
        try {
            return await Cart.findOneAndUpdate(
                { user_id: userId },
                { $set: { items: [] } },
                { new: true }
            ).populate({
                path: 'items.product_id',
                select: 'name base_price product_type status'
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new CartRepository();