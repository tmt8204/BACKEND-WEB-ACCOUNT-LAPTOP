const productService = require("../services/product.service");
const ApiResponse = require("../utils/api.response");

class ProductController {
    // Create a new physical product
    async createPhysicalProduct(req, res, next) {
        try {
            // Extract the product, physical product details, and item details from the request body
            const { productData, physicalData, itemData } = req.body;

            // Call the service method to create the physical product along with its details and item
            const result = await productService.createPhysicalProduct(productData, physicalData, itemData);

            // Return a success response with the created product details
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo sản phẩm vật lý thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Create a new digital product
    async createDigitalProduct(req, res, next) {
        try {
            // Extract the product, digital product details, and item details from the request body
            const { productData, digitalData, itemData } = req.body;

            // Call the service method to create the digital product along with its details and item
            const result = await productService.createDigitalProduct(productData, digitalData, itemData);

            return res.status(201).json(
                ApiResponse.success(201, 'Tạo sản phẩm kỹ thuật số thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ProductController();
        