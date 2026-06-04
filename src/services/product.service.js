const productRepository = require('../repositories/product.repository');

class ProductService {

    // Create a new physical product along with its physical product details and item
    async createPhysicalProduct(productData, physicalData, itemData) {
        try {
            // Prepare the data for the main product
            const product = {
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                product_type: 'physical'
            };

            // Prepare the physical product details
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

            // Prepare the physical product item details
            const item = {
                serial_number: itemData.serial_number,
                images_urls: itemData.images_urls || [],
                status: itemData.status || 'available',
                sale_price: itemData.sale_price
            }

            // Create the physical product along with its details and item in a transaction
            const newProduct = await productRepository.createPhysicalProduct(product, physical, item);

            return { newProduct };
        } catch (error) {
            throw error;
        };
    };

    // Create a new digital product along with its details and item
    async createDigitalProduct(productData, digitalData, itemData) {
        try {
            // Prepare the data for the main product
            const product = {
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                product_type: 'digital'
            };

            // Prepare the digital product details
            const digital = {
                platform:      digitalData.platform,
                category:      digitalData.category,
                region:        digitalData.region,
                duration_months: digitalData.duration_months
            };

            // Prepare the digital product item details
            const item = {
                account_email:    itemData.account_email,
                account_password: itemData.account_password,
                expired_at:       itemData.expired_at || null,
                status:           itemData.status || 'available',
                sale_price:       itemData.sale_price
            };

            // Create the digital product along with its details and item in a transaction
            const newProduct = await productRepository.createDigitalProduct(product, digital, item);

            return { newProduct };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ProductService();