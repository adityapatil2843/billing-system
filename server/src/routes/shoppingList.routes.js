const express = require('express');
const router = express.Router();
const shoppingListController = require('../controllers/shoppingList.controller');
const {
  validateObjectId,
  validateAddItemBody,
  validateUpdateQuantityBody,
} = require('../middleware/validation.middleware');

// POST /api/shopping-lists (Create a new shopping list)
router.post('/', shoppingListController.createList);

// GET /api/shopping-lists/:id (Get shopping list by ID)
router.get('/:id', validateObjectId('id'), shoppingListController.getListById);

// POST /api/shopping-lists/:id/items (Add item by barcode to shopping list)
router.post('/:id/items', validateObjectId('id'), validateAddItemBody, shoppingListController.addItem);

// PUT /api/shopping-lists/:id/items/:itemId (Update item quantity)
router.put(
  '/:id/items/:itemId',
  validateObjectId('id'),
  validateObjectId('itemId'),
  validateUpdateQuantityBody,
  shoppingListController.updateItemQuantity
);

// DELETE /api/shopping-lists/:id/items/:itemId (Remove item from shopping list)
router.delete(
  '/:id/items/:itemId',
  validateObjectId('id'),
  validateObjectId('itemId'),
  shoppingListController.removeItem
);

// DELETE /api/shopping-lists/:id (Delete entire shopping list)
router.delete('/:id', validateObjectId('id'), shoppingListController.deleteList);

module.exports = router;
