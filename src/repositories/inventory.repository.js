const InventoryLog    = require('../models/inventory-log.model');
const Product         = require('../models/product.model');
const PhysicalProduct = require('../models/physical-product.model');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProduct  = require('../models/digital-product.model');
const DigitalProductItem  = require('../models/digital-product-item.model');

class InventoryRepository {

    // ─── LOG ────────────────────────────────────────────────────────────

    async createLog(logData, session = null) {
        try {
            const options = session ? { session } : {};
            const [log] = await InventoryLog.create([logData], options);
            return log;
        } catch (error) {
            throw error;
        }
    }

    async getLogs({ filters = {}, page = 1, limit = 20 }) {
        try {
            const query = {};
            if (filters.product_id)   query.product_id   = filters.product_id;
            if (filters.action)       query.action       = filters.action;
            if (filters.product_type) query.product_type = filters.product_type;
            if (filters.created_by)   query.created_by   = filters.created_by;

            if (filters.from || filters.to) {
                query.createdAt = {};
                if (filters.from) query.createdAt.$gte = new Date(filters.from);
                if (filters.to)   query.createdAt.$lte = new Date(filters.to);
            }

            const skip = (page - 1) * limit;
            const [logs, total] = await Promise.all([
                InventoryLog.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('product_id', 'name product_type')
                    .populate('created_by', 'fullname email'),
                InventoryLog.countDocuments(query)
            ]);

            return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            throw error;
        }
    }

    // ─── STOCK SUMMARY ──────────────────────────────────────────────────

    /**
     * Thống kê tồn kho cho physical products
     * Trả về: available / reserved / sold count cho từng product
     */
    async getPhysicalStockSummary({ search, page, limit }) {
        try {
            const productQuery = { product_type: 'physical' };
            if (search) productQuery.name = { $regex: search, $options: 'i' };

            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                Product.find(productQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
                Product.countDocuments(productQuery)
            ]);

            const summaries = await Promise.all(products.map(async (product) => {
                const physical = await PhysicalProduct.findOne({ product_id: product._id });
                if (!physical) return null;

                const [available, reserved, sold] = await Promise.all([
                    PhysicalProductItem.countDocuments({ physical_product_id: physical._id, status: 'available' }),
                    PhysicalProductItem.countDocuments({ physical_product_id: physical._id, status: 'reserved' }),
                    PhysicalProductItem.countDocuments({ physical_product_id: physical._id, status: 'sold' })
                ]);

                return {
                    product_id:   product._id,
                    product_name: product.name,
                    product_type: 'physical',
                    is_active:    product.is_active,
                    base_price:   product.base_price,
                    brand:  physical.brand,
                    model:  physical.model,
                    stock: { available, reserved, sold, total: available + reserved + sold }
                };
            }));

            return {
                products: summaries.filter(Boolean),
                total, page, limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Thống kê tồn kho cho digital products
     */
    async getDigitalStockSummary({ search, page, limit }) {
        try {
            const productQuery = { product_type: 'digital' };
            if (search) productQuery.name = { $regex: search, $options: 'i' };

            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                Product.find(productQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
                Product.countDocuments(productQuery)
            ]);

            const summaries = await Promise.all(products.map(async (product) => {
                const digital = await DigitalProduct.findOne({ product_id: product._id });
                if (!digital) return null;

                const [available, sold, expired] = await Promise.all([
                    DigitalProductItem.countDocuments({ digital_product_id: digital._id, status: 'available' }),
                    DigitalProductItem.countDocuments({ digital_product_id: digital._id, status: 'sold' }),
                    DigitalProductItem.countDocuments({ digital_product_id: digital._id, status: 'expired' })
                ]);

                return {
                    product_id:   product._id,
                    product_name: product.name,
                    product_type: 'digital',
                    is_active:    product.is_active,
                    base_price:   product.base_price,
                    platform: digital.platform,
                    category: digital.category,
                    region:   digital.region,
                    stock: { available, sold, expired, total: available + sold + expired }
                };
            }));

            return {
                products: summaries.filter(Boolean),
                total, page, limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw error;
        }
    }

    // ─── LOW STOCK ──────────────────────────────────────────────────────

    /**
     * Lấy các physical product có số lượng available <= threshold
     */
    async getLowStockPhysical(threshold = 3) {
        try {
            const physicals = await PhysicalProduct.find().populate('product_id');

            const results = await Promise.all(physicals.map(async (physical) => {
                const available = await PhysicalProductItem.countDocuments({
                    physical_product_id: physical._id,
                    status: 'available'
                });
                if (available <= threshold) {
                    return {
                        product_id:   physical.product_id?._id,
                        product_name: physical.product_id?.name,
                        brand:  physical.brand,
                        model:  physical.model,
                        is_active: physical.product_id?.is_active,
                        available_stock: available
                    };
                }
                return null;
            }));

            return results.filter(Boolean);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy các digital product có số lượng available <= threshold
     */
    async getLowStockDigital(threshold = 3) {
        try {
            const digitals = await DigitalProduct.find().populate('product_id');

            const results = await Promise.all(digitals.map(async (digital) => {
                const available = await DigitalProductItem.countDocuments({
                    digital_product_id: digital._id,
                    status: 'available'
                });
                if (available <= threshold) {
                    return {
                        product_id:   digital.product_id?._id,
                        product_name: digital.product_id?.name,
                        platform: digital.platform,
                        category: digital.category,
                        region:   digital.region,
                        is_active: digital.product_id?.is_active,
                        available_stock: available
                    };
                }
                return null;
            }));

            return results.filter(Boolean);
        } catch (error) {
            throw error;
        }
    }

    // ─── HELPERS ────────────────────────────────────────────────────────

    async findPhysicalByProductId(productId) {
        return PhysicalProduct.findOne({ product_id: productId });
    }

    async findDigitalByProductId(productId) {
        return DigitalProduct.findOne({ product_id: productId });
    }

    async createPhysicalItem(itemData, session = null) {
        const options = session ? { session } : {};
        const [item] = await PhysicalProductItem.create([itemData], options);
        return item;
    }

    async createDigitalItem(itemData, session = null) {
        const options = session ? { session } : {};
        const [item] = await DigitalProductItem.create([itemData], options);
        return item;
    }
}

module.exports = new InventoryRepository();