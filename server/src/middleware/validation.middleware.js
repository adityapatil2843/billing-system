const mongoose = require('mongoose');
const { errorResponse } = require('../utils/response');

/**
 * Validate MongoDB ObjectId in request params
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, `Invalid ${paramName} format`, 400);
    }
    next();
  };
};

/**
 * Validate Barcode Param
 */
const validateBarcodeParam = (req, res, next) => {
  const barcode = req.params.barcode;
  if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
    return errorResponse(res, 'Barcode parameter is required and cannot be empty', 400);
  }
  req.params.barcode = barcode.trim();
  next();
};

/**
 * Validate Product Create / Update Body
 */
const validateProductBody = (isUpdate = false) => {
  return (req, res, next) => {
    const { barcode, name, price, brand, category, image, unit, description } = req.body;

    if (!isUpdate) {
      if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
        return errorResponse(res, 'Barcode is required and must be a non-empty string', 400);
      }
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return errorResponse(res, 'Product name is required and must be a non-empty string', 400);
      }
      if (price === undefined || price === null || typeof Number(price) !== 'number' || isNaN(Number(price)) || Number(price) <= 0) {
        return errorResponse(res, 'Price is required and must be a positive number', 400);
      }
    } else {
      if (barcode !== undefined && (typeof barcode !== 'string' || barcode.trim() === '')) {
        return errorResponse(res, 'Barcode must be a non-empty string', 400);
      }
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return errorResponse(res, 'Product name must be a non-empty string', 400);
      }
      if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
        return errorResponse(res, 'Price must be a positive number', 400);
      }
    }

    // Sanitize values
    if (req.body.barcode) req.body.barcode = req.body.barcode.trim();
    if (req.body.name) req.body.name = req.body.name.trim();
    if (req.body.price !== undefined) req.body.price = Number(req.body.price);

    next();
  };
};

/**
 * Validate Add Item to Shopping List
 */
const validateAddItemBody = (req, res, next) => {
  const { barcode, quantity } = req.body;

  if (!barcode || typeof barcode !== 'string' || barcode.trim() === '') {
    return errorResponse(res, 'Barcode is required', 400);
  }

  const parsedQty = quantity !== undefined ? Number(quantity) : 1;
  if (isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty < 1) {
    return errorResponse(res, 'Quantity must be an integer of at least 1', 400);
  }

  req.body.barcode = barcode.trim();
  req.body.quantity = parsedQty;
  next();
};

/**
 * Validate Update Item Quantity
 */
const validateUpdateQuantityBody = (req, res, next) => {
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    return errorResponse(res, 'Quantity is required', 400);
  }

  const parsedQty = Number(quantity);
  if (isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty < 1) {
    return errorResponse(res, 'Quantity must be an integer of at least 1', 400);
  }

  req.body.quantity = parsedQty;
  next();
};

module.exports = {
  validateObjectId,
  validateBarcodeParam,
  validateProductBody,
  validateAddItemBody,
  validateUpdateQuantityBody,
};
