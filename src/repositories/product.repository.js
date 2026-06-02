const Product = require('../models/product.model');
const mongoose = require('mongoose');
const PhysicalProduct = require('../models/physical-product.model');
const PhysicalProductItem = require('../models/physical-product-item.model');

class ProductRepository {

    async createProduct(productData, physicalData, itemData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const [newProduct] = await Product.create([productData], { session });

            const [newPhysical] = await PhysicalProduct.create(
                [{ ...physicalData, product_id: newProduct._id }],
                { session }
            );

            const [newItem] = await PhysicalProductItem.create(
                [{ ...itemData, physical_product_id: newPhysical._id }],
                { session }
            );

            await session.commitTransaction();

            return {
                product: newProduct,
                physical: newPhysical,
                item: newItem
             };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

module.exports = new ProductRepository();