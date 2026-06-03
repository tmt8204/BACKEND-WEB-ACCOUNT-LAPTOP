const Product = require('../models/product.model');
const mongoose = require('mongoose');
const PhysicalProduct = require('../models/physical-product.model');
const PhysicalProductItem = require('../models/physical-product-item.model');
const DigitalProduct = require('../models/digital-product.model');
const DigitalProductItem = require('../models/digital-product-item.model');

class ProductRepository {

    // Create a new product along with its physical product and item in a transaction
    async createPhysicalProduct(productData, physicalData, itemData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Create the main product
            const [newProduct] = await Product.create([productData], { session });

            // Create the physical product linked to the main product
            const [newPhysical] = await PhysicalProduct.create(
                [{ ...physicalData, product_id: newProduct._id }],
                { session }
            );

            // Create the physical product item linked to the physical product
            const [newItem] = await PhysicalProductItem.create(
                [{ ...itemData, physical_product_id: newPhysical._id }],
                { session }
            );

            // Commit the transaction
            await session.commitTransaction();

            // Return the created product, physical product, and item
            return {
                product: newProduct,
                physical: newPhysical,
                item: newItem
             };
        } catch (error) {
            // If any error occurs, abort the transaction and throw the error
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    // Create a new digital product and its item in a transaction
    async createDigitalProduct(productData, digitalData, itemData) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Create the main product
            const [newProduct] = await Product.create([productData], { session });

            // Create the digital product linked to the main product
            const [newDigital] = await DigitalProduct.create(
                [{ ...digitalData, product_id: newProduct._id }],
                { session }
            );

            // Create the digital product item linked to the digital product
            const [newItem] = await DigitalProductItem.create(
                [{ ...itemData, digital_product_id: newDigital._id }],
                { session }
            );

            // Commit the transaction
            await session.commitTransaction();

            // Return the created product, digital product, and item
            return {
                product: newProduct,
                digital: newDigital,
                item: newItem
            };
        } catch (error) {
            // If any error occurs, abort the transaction and throw the error
            await session.abortTransaction();
            throw error;
        } finally {
            // End the session
            session.endSession();
        }
    }
}

module.exports = new ProductRepository();