const shoppingListService = require('../services/shoppingList.service');
const { successResponse, errorResponse } = require('../utils/response');

class ShoppingListController {
  /**
   * POST /api/shopping-lists
   */
  async createList(req, res, next) {
    try {
      const { name } = req.body;
      const list = await shoppingListService.createList(name);
      return successResponse(res, list, 'Shopping list created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/shopping-lists/:id
   */
  async getListById(req, res, next) {
    try {
      const { id } = req.params;
      const list = await shoppingListService.getListById(id);

      if (!list) {
        return errorResponse(res, 'Shopping list not found', 404);
      }

      return successResponse(res, list, 'Shopping list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/shopping-lists/:id/items
   */
  async addItem(req, res, next) {
    try {
      const { id } = req.params;
      const { barcode, quantity } = req.body;

      const updatedList = await shoppingListService.addItemToList(id, { barcode, quantity });
      return successResponse(res, updatedList, 'Item added to shopping list successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/shopping-lists/:id/items/:itemId
   */
  async updateItemQuantity(req, res, next) {
    try {
      const { id, itemId } = req.params;
      const { quantity } = req.body;

      const updatedList = await shoppingListService.updateItemQuantity(id, itemId, quantity);
      return successResponse(res, updatedList, 'Item quantity updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/shopping-lists/:id/items/:itemId
   */
  async removeItem(req, res, next) {
    try {
      const { id, itemId } = req.params;
      const updatedList = await shoppingListService.removeItemFromList(id, itemId);

      return successResponse(res, updatedList, 'Item removed from shopping list successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/shopping-lists/:id
   */
  async deleteList(req, res, next) {
    try {
      const { id } = req.params;
      await shoppingListService.deleteList(id);

      return successResponse(res, { id }, 'Shopping list deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ShoppingListController();
