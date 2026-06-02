const productRepository = require('../repositories/product.repository');

class ProductService {

    async createPhysicalProduct(productData, physicalData, itemData) {
        try {
            const product = {
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                product_type: 'physical'
            };

            const physical = {
                brand: physicalData.brand,
                model: physicalData.model,
                weight_kg: physicalData.weight_kg,
                cpu: physicalData.cpu,
                gpu: physicalData.gpu,
                ram: physicalData.ram,
                storage: physicalData.storage,
                display_inches: physicalData.display_inches,
                os: physicalData.os,
                condition_percent: physicalData.condition_percent,
                warranty_months: physicalData.warranty_months,
                important_price: physicalData.important_price
            };

            const item = {
                serial_number: itemData.serial_number,
                images_urls: itemData.images_urls || [],
                status: itemData.status || 'available',
                sale_price: itemData.sale_price
            }

            const newProduct = await productRepository.createProduct(product, physical, item);

            return { newProduct };
        } catch (error) {
            throw error;
        };
    };
}

module.exports = new ProductService();