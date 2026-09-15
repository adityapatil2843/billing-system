const Product = require('../models/product.model');

class ProductService {
  /**
   * Find a product by its barcode.
   * Extensible: If not found locally in MongoDB, external API fallback can be plugged in here.
   */
  async findProductByBarcode(barcode) {
    const trimmedBarcode = barcode.trim();
    
    // 1. Check local MongoDB database
    const localProduct = await Product.findOne({ barcode: trimmedBarcode });
    if (localProduct) {
      return localProduct;
    }

    // 2. Future expansion: Lookup in External Product API (e.g. OpenFoodFacts, UPC ItemDB)
    // const externalProduct = await this.lookupExternalApi(trimmedBarcode);
    // if (externalProduct) {
    //   return await this.createProduct(externalProduct);
    // }

    return null;
  }

  /**
   * Get all products with pagination and search filter
   */
  async getProducts({ page = 1, limit = 20, search = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { barcode: searchRegex },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single product by Mongo ID
   */
  async getProductById(id) {
    return await Product.findById(id);
  }

  /**
   * Create a new product
   */
  async createProduct(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  /**
   * Update an existing product by Mongo ID
   */
  async updateProduct(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete a product by Mongo ID
   */
  async deleteProduct(id) {
    return await Product.findByIdAndDelete(id);
  }
}

module.exports = new ProductService();
