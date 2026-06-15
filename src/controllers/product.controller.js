const productService = require("../services/product.service");
const ApiResponse = require("../utils/api.response");

class ProductController {

    // ───────────────────────── CREATE ─────────────────────────

    async createPhysicalProduct(req, res, next) {
        try {
            const { productData, physicalData, itemData } = req.body;
            const result = await productService.createPhysicalProduct(productData, physicalData, itemData);
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo sản phẩm vật lý thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async createDigitalProduct(req, res, next) {
        try {
            const { productData, digitalData, itemData } = req.body;
            const result = await productService.createDigitalProduct(productData, digitalData, itemData);
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo sản phẩm kỹ thuật số thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ───────────────────────── READ ─────────────────────────

    async getAllProducts(req, res, next) {
        try {
            const { product_type, is_active, search, page, limit } = req.query;
            const result = await productService.getAllProducts({ product_type, is_active, search, page, limit });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách sản phẩm thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productService.getProductById(id);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy thông tin sản phẩm thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ───────────────────────── UPDATE ─────────────────────────

    async updatePhysicalProduct(req, res, next) {
        try {
            const { id } = req.params;
            const { productData, physicalData } = req.body;
            const result = await productService.updatePhysicalProduct(id, productData || {}, physicalData || {});
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật sản phẩm vật lý thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async updateDigitalProduct(req, res, next) {
        try {
            const { id } = req.params;
            const { productData, digitalData } = req.body;
            const result = await productService.updateDigitalProduct(id, productData || {}, digitalData || {});
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật sản phẩm kỹ thuật số thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async updatePhysicalItem(req, res, next) {
        try {
            const { itemId } = req.params;
            const result = await productService.updatePhysicalItem(itemId, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật item vật lý thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async updateDigitalItem(req, res, next) {
        try {
            const { itemId } = req.params;
            const result = await productService.updateDigitalItem(itemId, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật item kỹ thuật số thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // ───────────────────────── DELETE ─────────────────────────

    /** Soft-delete: ẩn sản phẩm (is_active = false) */
    async softDeleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            const result = await productService.softDeleteProduct(id);
            return res.status(200).json(
                ApiResponse.success(200, 'Ẩn sản phẩm thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    /** Hard-delete: xoá hẳn khỏi database */
    async hardDeleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await productService.hardDeleteProduct(id);
            return res.status(200).json(
                ApiResponse.success(200, 'Xoá sản phẩm thành công', null)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();