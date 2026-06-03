const productService = require("../services/product.service");
const ApiResponse = require("../utils/api.response");

class ProductController {
    // Create a new physical product
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
}

module.exports = new ProductController();
        