const cartRepository = require("../repositories/cart.repository");
const PhysicalProductItem = require("../models/physical-product-item.model");
const DigitalProductItem = require("../models/digital-product-item.model");
const Product = require('../models/product.model');

class CartService {
    async getCartByUserId(userId) {
        try {
            let cart = await cartRepository.findCartOrCreateCart(userId);
            if (!cart) {
                cart = await cartRepository.createCart(userId);
            }
            return this._formatCart(cart);
        } catch (error) {
            throw error;
        }
    }

    async addItemToCart(userId, data) {
        try {
            const { item_id, product_type, quantity = 1 } = data;

            if (!item_id || !product_type) {
                const error = new Error('item_id và product_type là bắt buộc');
                error.statusCode = 400;
                throw error;
            }

            if (quantity < 1) {
                const error = new Error('Số lượng phải lớn hơn 0');
                error.statusCode = 400;
                throw error;
            }

            let item;

            if (product_type === 'physical') {
                item = await PhysicalProductItem.findById(item_id)
                    .populate('physical_product_id');
            } else if (product_type === 'digital') {
                item = await DigitalProductItem.findById(item_id)
                    .populate('digital_product_id');
            } else {
                const error = new Error('Loại sản phẩm không hợp lệ');
                error.statusCode = 400;
                throw error;
            }

            if (!item) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (item.status !== 'available') {
                const error = new Error('Sản phẩm không còn hàng');
                error.statusCode = 400;
                throw error;
            }

            // Lấy base Product để kiểm tra is_active
            const productId = product_type === 'physical'
                ? item.physical_product_id?.product_id
                : item.digital_product_id?.product_id;

            if (!productId) {
                const error = new Error('Không tìm thấy thông tin sản phẩm');
                error.statusCode = 404;
                throw error;
            }

            const product = await Product.findById(productId);
            if (!product || !product.is_active) {
                const error = new Error('Sản phẩm đã ngừng kinh doanh');
                error.statusCode = 400;
                throw error;
            }

            // Digital: quantity phải là 1
            if (product_type === 'digital' && quantity !== 1) {
                const error = new Error('Sản phẩm kỹ thuật số chỉ có thể thêm với số lượng 1');
                error.statusCode = 400;
                throw error;
            }

            // Kiểm tra item đã có trong cart chưa
            let cart = await cartRepository.findCartOrCreateCart(userId);
            if (!cart) {
                cart = await cartRepository.createCart(userId);
            }

            const existingItem = cart.items.find(
                i => i.item_id.toString() === item_id.toString()
            );

            if (existingItem) {
                const error = new Error('Sản phẩm đã có trong giỏ hàng');
                error.statusCode = 400;
                throw error;
            }

            const cartItem = {
                product_id: product._id,
                item_id: item._id,
                item_type: product_type,
                quantity,
                sale_price: item.sale_price
            };

            const updatedCart = await cartRepository.addItemToCart(userId, cartItem);
            return this._formatCart(updatedCart);
        } catch (error) {
            throw error;
        }
    }

    async updateItemQuantity(userId, cartItemId, quantity) {
        try {
            if (quantity < 1) {
                const error = new Error('Số lượng phải lớn hơn 0');
                error.statusCode = 400;
                throw error;
            }

            const cart = await cartRepository.findCartByUserId(userId);
            if (!cart) {
                const error = new Error('Giỏ hàng không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            const cartItem = cart.items.find(i => i._id.toString() === cartItemId);
            if (!cartItem) {
                const error = new Error('Sản phẩm không có trong giỏ hàng');
                error.statusCode = 404;
                throw error;
            }

            // Digital không thể đổi số lượng
            if (cartItem.item_type === 'digital') {
                const error = new Error('Không thể thay đổi số lượng sản phẩm kỹ thuật số');
                error.statusCode = 400;
                throw error;
            }

            const updatedCart = await cartRepository.updateCartItem(userId, cartItemId, quantity);
            return this._formatCart(updatedCart);
        } catch (error) {
            throw error;
        }
    }

    async removeItem(userId, cartItemId) {
        try {
            const cart = await cartRepository.findCartByUserId(userId);
            if (!cart) {
                const error = new Error('Giỏ hàng không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            const exists = cart.items.find(i => i._id.toString() === cartItemId);
            if (!exists) {
                const error = new Error('Sản phẩm không có trong giỏ hàng');
                error.statusCode = 404;
                throw error;
            }

            const updatedCart = await cartRepository.removeItemFromCart(userId, cartItemId);
            return this._formatCart(updatedCart);
        } catch (error) {
            throw error;
        }
    }

    async clearCart(userId) {
        try {
            await cartRepository.clearCart(userId);
            return { message: 'Đã xóa toàn bộ giỏ hàng' };
        } catch (error) {
            throw error;
        }
    }

    _formatCart(cart) {
        if (!cart) return { items: [], total_items: 0, total_price: 0 };

        const items = cart.items.map(item => ({
            cart_item_id: item._id,
            product_id: item.product_id?._id || item.product_id,
            product_name: item.product_id?.name || null,
            product_type: item.item_type,   // item_type trong schema chính là physical/digital
            item_id: item.item_id,
            quantity: item.quantity,
            sale_price: item.sale_price,
            subtotal: item.sale_price * item.quantity
        }));

        const total_price = items.reduce((sum, i) => sum + i.subtotal, 0);

        return {
            cart_id: cart._id,
            items,
            total_items: items.length,
            total_price
        };
    }
}

module.exports = new CartService();