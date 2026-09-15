const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const {
  validateObjectId,
  validateBarcodeParam,
  validateProductBody,
} = require('../middleware/validation.middleware');

// GET /api/products/barcode/:barcode (placed before :id route so it doesn't get shadowed)
router.get('/barcode/:barcode', validateBarcodeParam, productController.getProductByBarcode);

// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/:id
router.get('/:id', validateObjectId('id'), productController.getProductById);

// POST /api/products
router.post('/', validateProductBody(false), productController.createProduct);

// PUT /api/products/:id
router.put('/:id', validateObjectId('id'), validateProductBody(true), productController.updateProduct);

// DELETE /api/products/:id
router.delete('/:id', validateObjectId('id'), productController.deleteProduct);

module.exports = router;
