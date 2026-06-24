const mongoose = require('mongoose');
const inventoryRepository = require('../repositories/inventory.repository');
const productRepository   = require('../repositories/product.repository');

class InventoryService {

    // ══════════════════════════════════════════════════════════════
    // 1. NHẬP KHO — thêm item mới vào physical/digital product có sẵn
    // ══════════════════════════════════════════════════════════════

    /**
     * Nhập kho physical: thêm một PhysicalProductItem mới vào product có sẵn.
     * @param {string} productId  - _id của Product (base)
     * @param {object} itemData   - { serial_number, images_urls, sale_price, status? }
     * @param {string} staffId    - người thực hiện
     * @param {string} note
     */
    async stockInPhysical(productId, itemData, staffId, note = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Validate product tồn tại và đúng type
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const err = new Error('Sản phẩm không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (base.product_type !== 'physical') {
                const err = new Error('Sản phẩm này không phải sản phẩm vật lý');
                err.statusCode = 400;
                throw err;
            }

            // Lấy physical document
            const physical = await inventoryRepository.findPhysicalByProductId(productId);
            if (!physical) {
                const err = new Error('Không tìm thấy thông tin sản phẩm vật lý');
                err.statusCode = 404;
                throw err;
            }

            // Tạo item mới
            const newItem = await inventoryRepository.createPhysicalItem(
                {
                    physical_product_id: physical._id,
                    serial_number: itemData.serial_number,
                    images_urls:   itemData.images_urls || [],
                    sale_price:    itemData.sale_price,
                    status:        itemData.status || 'available'
                },
                session
            );

            // Ghi log nhập kho
            await inventoryRepository.createLog(
                {
                    product_id:   base._id,
                    item_id:      newItem._id,
                    item_type_ref:'PhysicalProductItem',
                    product_type: 'physical',
                    action:       'stock_in',
                    status_before: null,
                    status_after:  newItem.status,
                    note,
                    created_by:   staffId
                },
                session
            );

            await session.commitTransaction();
            return { item: newItem, message: 'Nhập kho thành công' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Nhập kho digital: thêm một DigitalProductItem mới vào product có sẵn.
     * @param {string} productId
     * @param {object} itemData - { account_email, account_password, expired_at, sale_price, status? }
     * @param {string} staffId
     * @param {string} note
     */
    async stockInDigital(productId, itemData, staffId, note = null) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const err = new Error('Sản phẩm không tồn tại');
                err.statusCode = 404;
                throw err;
            }
            if (base.product_type !== 'digital') {
                const err = new Error('Sản phẩm này không phải sản phẩm kỹ thuật số');
                err.statusCode = 400;
                throw err;
            }

            const digital = await inventoryRepository.findDigitalByProductId(productId);
            if (!digital) {
                const err = new Error('Không tìm thấy thông tin sản phẩm kỹ thuật số');
                err.statusCode = 404;
                throw err;
            }

            const newItem = await inventoryRepository.createDigitalItem(
                {
                    digital_product_id: digital._id,
                    account_email:      itemData.account_email,
                    account_password:   itemData.account_password,
                    expired_at:         itemData.expired_at || null,
                    sale_price:         itemData.sale_price,
                    status:             itemData.status || 'available'
                },
                session
            );

            await inventoryRepository.createLog(
                {
                    product_id:    base._id,
                    item_id:       newItem._id,
                    item_type_ref: 'DigitalProductItem',
                    product_type:  'digital',
                    action:        'stock_in',
                    status_before: null,
                    status_after:  newItem.status,
                    note,
                    created_by:    staffId
                },
                session
            );

            await session.commitTransaction();
            return { item: newItem, message: 'Nhập kho thành công' };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 2. XEM TỒN KHO — thống kê available/reserved/sold
    // ══════════════════════════════════════════════════════════════

    async getStockSummary({ product_type, search, page, limit }) {
        try {
            const pageNum  = Math.max(1, parseInt(page)  || 1);
            const limitNum = Math.min(100, parseInt(limit) || 10);

            // Nếu không lọc type thì trả về cả 2
            if (!product_type || product_type === 'physical') {
                const physical = await inventoryRepository.getPhysicalStockSummary({
                    search, page: pageNum, limit: limitNum
                });
                if (product_type === 'physical') return physical;

                const digital = await inventoryRepository.getDigitalStockSummary({
                    search, page: pageNum, limit: limitNum
                });

                return {
                    physical,
                    digital
                };
            }

            // product_type === 'digital'
            return await inventoryRepository.getDigitalStockSummary({
                search, page: pageNum, limit: limitNum
            });
        } catch (error) {
            throw error;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 3. CẢNH BÁO HÀNG SẮP HẾT — low stock alert
    // ══════════════════════════════════════════════════════════════

    /**
     * @param {number} threshold  - ngưỡng cảnh báo (default 3)
     * @param {string} product_type - 'physical' | 'digital' | undefined (cả 2)
     */
    async getLowStockAlerts({ threshold = 3, product_type } = {}) {
        try {
            const thresholdNum = Math.max(0, parseInt(threshold) || 3);

            let physical = [];
            let digital  = [];

            if (!product_type || product_type === 'physical') {
                physical = await inventoryRepository.getLowStockPhysical(thresholdNum);
            }
            if (!product_type || product_type === 'digital') {
                digital = await inventoryRepository.getLowStockDigital(thresholdNum);
            }

            const total_alerts = physical.length + digital.length;

            return {
                threshold: thresholdNum,
                total_alerts,
                physical_alerts: physical,
                digital_alerts:  digital
            };
        } catch (error) {
            throw error;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // 4. LỊCH SỬ NHẬP/XUẤT KHO — inventory log
    // ══════════════════════════════════════════════════════════════

    /**
     * @param {object} filters - { product_id, action, product_type, from, to, created_by }
     * @param {number} page
     * @param {number} limit
     */
    async getInventoryLogs({ product_id, action, product_type, from, to, created_by, page, limit }) {
        try {
            const pageNum  = Math.max(1, parseInt(page)  || 1);
            const limitNum = Math.min(100, parseInt(limit) || 20);

            return await inventoryRepository.getLogs({
                filters: { product_id, action, product_type, from, to, created_by },
                page: pageNum,
                limit: limitNum
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new InventoryService();