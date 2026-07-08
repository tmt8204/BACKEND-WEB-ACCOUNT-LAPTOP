const productRepository = require('../repositories/product.repository');

class ProductService {

    // ───────────────────────── CREATE ─────────────────────────

    async createPhysicalProduct(productData, physicalData, itemData) {
        try {
            const product = {
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                product_type: 'physical'
            };
            const physical = { ...physicalData };
            const item = {
                serial_number: itemData.serial_number,
                images_urls: itemData.images || [],
                status: itemData.status || 'available',
                sale_price: itemData.sale_price
            };
            const newProduct = await productRepository.createPhysicalProduct(product, physical, item);
            return { newProduct };
        } catch (error) {
            throw error;
        }
    }

    async createDigitalProduct(productData, digitalData, itemData) {
        try {
            const product = {
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                product_type: 'digital'
            };
            const digital = { ...digitalData };
            const item = {
                account_email:    itemData.account_email,
                account_password: itemData.account_password,
                expired_at:       itemData.expired_at || null,
                status:           itemData.status || 'available',
                sale_price:       itemData.sale_price
            };
            const newProduct = await productRepository.createDigitalProduct(product, digital, item);
            return { newProduct };
        } catch (error) {
            throw error;
        }
    }

    // ───────────────────────── READ ─────────────────────────

    async getAllProducts({ product_type, is_active, search, page, limit }) {
        try {
            const filters = {};
            if (product_type) filters.product_type = product_type;
            if (is_active !== undefined) filters.is_active = is_active === 'true' || is_active === true;
            if (search) filters.search = search;

            const pageNum  = Math.max(1, parseInt(page)  || 1);
            const limitNum = Math.min(100, parseInt(limit) || 10);

            return await productRepository.getAllProducts({ filters, page: pageNum, limit: limitNum });
        } catch (error) {
            throw error;
        }
    }

    async getProductById(productId) {
        try {
            // Lấy base product trước để biết type
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (base.product_type === 'physical') {
                const result = await productRepository.getPhysicalProductById(productId);
                if (!result) {
                    const error = new Error('Không tìm thấy chi tiết sản phẩm vật lý');
                    error.statusCode = 404;
                    throw error;
                }
                return result;
            } else {
                const result = await productRepository.getDigitalProductById(productId);
                if (!result) {
                    const error = new Error('Không tìm thấy chi tiết sản phẩm kỹ thuật số');
                    error.statusCode = 404;
                    throw error;
                }
                return result;
            }
        } catch (error) {
            throw error;
        }
    }

    // ───────────────────────── UPDATE ─────────────────────────

    async updatePhysicalProduct(productId, productData, physicalData) {
        try {
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }
            if (base.product_type !== 'physical') {
                const error = new Error('Sản phẩm này không phải sản phẩm vật lý');
                error.statusCode = 400;
                throw error;
            }
            return await productRepository.updatePhysicalProduct(productId, productData, physicalData);
        } catch (error) {
            throw error;
        }
    }

    async updateDigitalProduct(productId, productData, digitalData) {
        try {
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }
            if (base.product_type !== 'digital') {
                const error = new Error('Sản phẩm này không phải sản phẩm kỹ thuật số');
                error.statusCode = 400;
                throw error;
            }
            return await productRepository.updateDigitalProduct(productId, productData, digitalData);
        } catch (error) {
            throw error;
        }
    }

    async updatePhysicalItem(itemId, itemData) {
        try {
            return await productRepository.updatePhysicalItem(itemId, itemData);
        } catch (error) {
            throw error;
        }
    }

    async updateDigitalItem(itemId, itemData) {
        try {
            return await productRepository.updateDigitalItem(itemId, itemData);
        } catch (error) {
            throw error;
        }
    }

    // ───────────────────────── DELETE ─────────────────────────

    async softDeleteProduct(productId) {
        try {
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }
            return await productRepository.softDeleteProduct(productId);
        } catch (error) {
            throw error;
        }
    }

    async hardDeleteProduct(productId) {
        try {
            const base = await productRepository.findProductById(productId);
            if (!base) {
                const error = new Error('Sản phẩm không tồn tại');
                error.statusCode = 404;
                throw error;
            }
            if (base.product_type === 'physical') {
                return await productRepository.hardDeletePhysicalProduct(productId);
            } else {
                return await productRepository.hardDeleteDigitalProduct(productId);
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProductService();