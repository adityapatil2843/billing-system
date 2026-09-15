const productService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/response');

class ProductController {
  /**
   * GET /api/products/barcode/:barcode
   */
  async getProductByBarcode(req, res, next) {
    try {
      const { barcode } = req.params;
      const product = await productService.findProductByBarcode(barcode);

      if (!product) {
        return res.status(200).json({
          success: true,
          exists: false,
          message: 'Product not found',
        });
      }

      return res.status(200).json({
        success: true,
        exists: true,
        product,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products
   */
  async getProducts(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const result = await productService.getProducts({ page, limit, search });

      return successResponse(
        res,
        result.products,
        'Products retrieved successfully',
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      return successResponse(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products
   */
  async createProduct(req, res, next) {
    try {
      const { barcode, name, price } = req.body;

      // Check if barcode already exists
      const existingProduct = await productService.findProductByBarcode(barcode);
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this barcode already exists',
        });
      }

      const product = await productService.createProduct(req.body);
      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product,
        data: product,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Product with this barcode already exists',
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      return successResponse(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.deleteProduct(id);

      if (!product) {
        return errorResponse(res, 'Product not found', 404);
      }

      return successResponse(res, { id }, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
