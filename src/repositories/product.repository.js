const Product = require('../models/product.model');
const mongoose = require('mongoose');
const PhysicalProduct = require('../models/physical-product.model');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProduct = require('../models/digital-product.model');
const DigitalProductItem = require('../models/digital-product-item.model');
const cloudinaryUtil = require('../utils/cloudinary.util');

class ProductRepository {

    // ───────────────────────── CREATE ─────────────────────────

    async createPhysicalProduct(productData, physicalData, itemData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const [newProduct] = await Product.create([productData], { session });
            const [newPhysical] = await PhysicalProduct.create(
                [{ ...physicalData, product_id: newProduct._id }], { session }
            );
            const [newItem] = await PhysicalProductItem.create(
                [{ ...itemData, physical_product_id: newPhysical._id }], { session }
            );
            await session.commitTransaction();
            return { product: newProduct, physical: newPhysical, item: newItem };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async createDigitalProduct(productData, digitalData, itemData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const [newProduct] = await Product.create([productData], { session });
            const [newDigital] = await DigitalProduct.create(
                [{ ...digitalData, product_id: newProduct._id }], { session }
            );
            const [newItem] = await DigitalProductItem.create(
                [{ ...itemData, digital_product_id: newDigital._id }], { session }
            );
            await session.commitTransaction();
            return { product: newProduct, digital: newDigital, item: newItem };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ───────────────────────── READ ─────────────────────────

    /**
     * Lấy danh sách sản phẩm có phân trang & lọc theo type / is_active
     * @param {object} filters  - { product_type, is_active, search }
     * @param {number} page
     * @param {number} limit
     */
    async getAllProducts({ filters = {}, page = 1, limit = 10 }) {
        const query = {};
        if (filters.product_type) query.product_type = filters.product_type;
        if (filters.is_active !== undefined) query.is_active = filters.is_active;
        if (filters.search) query.name = { $regex: filters.search, $options: 'i' };

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Product.countDocuments(query)
        ]);

        return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    /** Lấy chi tiết physical product theo product_id (base) */
    async getPhysicalProductById(productId) {
        const product = await Product.findById(productId);
        if (!product) return null;

        const physical = await PhysicalProduct.findOne({ product_id: productId });
        if (!physical) return null;

        const items = await PhysicalProductItem.find({ physical_product_id: physical._id });
        return { product, physical, items };
    }

    /** Lấy chi tiết digital product theo product_id (base) */
    async getDigitalProductById(productId) {
        const product = await Product.findById(productId);
        if (!product) return null;

        const digital = await DigitalProduct.findOne({ product_id: productId });
        if (!digital) return null;

        const items = await DigitalProductItem.find({ digital_product_id: digital._id });
        return { product, digital, items };
    }

    // ───────────────────────── UPDATE ─────────────────────────

    async updatePhysicalProduct(productId, productData, physicalData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId, productData, { new: true, session }
            );
            if (!updatedProduct) throw Object.assign(new Error('Sản phẩm không tồn tại'), { statusCode: 404 });

            const updatedPhysical = await PhysicalProduct.findOneAndUpdate(
                { product_id: productId }, physicalData, { new: true, session }
            );

            await session.commitTransaction();
            return { product: updatedProduct, physical: updatedPhysical };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updateDigitalProduct(productId, productData, digitalData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const updatedProduct = await Product.findByIdAndUpdate(
                productId, productData, { new: true, session }
            );
            if (!updatedProduct) throw Object.assign(new Error('Sản phẩm không tồn tại'), { statusCode: 404 });

            const updatedDigital = await DigitalProduct.findOneAndUpdate(
                { product_id: productId }, digitalData, { new: true, session }
            );

            await session.commitTransaction();
            return { product: updatedProduct, digital: updatedDigital };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /** Cập nhật trạng thái / thông tin một item vật lý */
    async updatePhysicalItem(itemId, itemData) {
        const item = await PhysicalProductItem.findByIdAndUpdate(
            itemId, itemData, { new: true }
        );
        if (!item) throw Object.assign(new Error('Item không tồn tại'), { statusCode: 404 });
        return item;
    }

    /** Cập nhật trạng thái / thông tin một item kỹ thuật số */
    async updateDigitalItem(itemId, itemData) {
        const item = await DigitalProductItem.findByIdAndUpdate(
            itemId, itemData, { new: true }
        );
        if (!item) throw Object.assign(new Error('Item không tồn tại'), { statusCode: 404 });
        return item;
    }

    // ───────────────────────── DELETE ─────────────────────────

    /** Soft-delete: đặt is_active = false */
    async softDeleteProduct(productId) {
        const product = await Product.findByIdAndUpdate(
            productId, { is_active: false }, { new: true }
        );
        if (!product) throw Object.assign(new Error('Sản phẩm không tồn tại'), { statusCode: 404 });
        return product;
    }

    /** Hard-delete toàn bộ product + sub-docs trong transaction */
    async hardDeletePhysicalProduct(productId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const physical = await PhysicalProduct.findOne({ product_id: productId }).session(session);
            let publicIdsToDelete = [];

            if (physical) {
                const items = await PhysicalProductItem.find({ physical_product_id: physical._id }).session(session);
                items.forEach(item => {
                    item.images?.forEach(img => publicIdsToDelete.push(img.public_id));
                });

                await PhysicalProductItem.deleteMany({ physical_product_id: physical._id }, { session });
                await PhysicalProduct.deleteOne({ _id: physical._id }, { session });
            }
            const deleted = await Product.findByIdAndDelete(productId, { session });
            if (!deleted) throw Object.assign(new Error('Sản phẩm không tồn tại'), { statusCode: 404 });

            await session.commitTransaction();

            if(publicIdsToDelete.length > 0) {
                cloudinaryUtil.deleteMultipleImages(publicIdsToDelete).catch(err => {
                    console.error('Lỗi khi xoá ảnh trên Cloudinary:', err);
                });
            }

            return deleted;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async hardDeleteDigitalProduct(productId) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const digital = await DigitalProduct.findOne({ product_id: productId }).session(session);
            if (digital) {
                await DigitalProductItem.deleteMany({ digital_product_id: digital._id }, { session });
                await DigitalProduct.deleteOne({ _id: digital._id }, { session });
            }
            const deleted = await Product.findByIdAndDelete(productId, { session });
            if (!deleted) throw Object.assign(new Error('Sản phẩm không tồn tại'), { statusCode: 404 });

            await session.commitTransaction();
            return deleted;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ─────────────────────── HELPERS ───────────────────────

    async findProductById(productId) {
        return Product.findById(productId);
    }
}

module.exports = new ProductRepository();