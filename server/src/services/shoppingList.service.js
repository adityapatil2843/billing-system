const ShoppingList = require('../models/shoppingList.model');
const productService = require('./product.service');

class ShoppingListService {
  /**
   * Create a new shopping list
   */
  async createList(name = 'My Shopping List') {
    const shoppingList = new ShoppingList({
      name: name && name.trim() !== '' ? name.trim() : 'My Shopping List',
      items: [],
      total: 0,
    });
    return await shoppingList.save();
  }

  /**
   * Get a shopping list by its ID
   */
  async getListById(listId) {
    return await ShoppingList.findById(listId).populate('items.product');
  }

  /**
   * Add a product to the shopping list by barcode
   */
  async addItemToList(listId, { barcode, quantity = 1 }) {
    const list = await ShoppingList.findById(listId);
    if (!list) {
      const error = new Error('Shopping list not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    // 1. Find product using barcode
    const product = await productService.findProductByBarcode(barcode);
    if (!product) {
      const error = new Error(`Product with barcode '${barcode}' not found`);
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    // 2. Check if product already exists in the shopping list
    const existingItemIndex = list.items.findIndex(
      (item) => item.barcode === product.barcode || item.product.toString() === product._id.toString()
    );

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    if (existingItemIndex > -1) {
      // Increase existing quantity
      list.items[existingItemIndex].quantity += qtyToAdd;
      list.items[existingItemIndex].subtotal = Number(
        (list.items[existingItemIndex].price * list.items[existingItemIndex].quantity).toFixed(2)
      );
    } else {
      // Create and push new item
      const subtotal = Number((product.price * qtyToAdd).toFixed(2));
      list.items.push({
        product: product._id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        quantity: qtyToAdd,
        subtotal: subtotal,
      });
    }

    // 3. Recalculate total & save
    list.recalculateTotal();
    await list.save();

    return await this.getListById(list._id);
  }

  /**
   * Update item quantity in a shopping list
   */
  async updateItemQuantity(listId, itemId, quantity) {
    const list = await ShoppingList.findById(listId);
    if (!list) {
      const error = new Error('Shopping list not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    const item = list.items.id(itemId);
    if (!item) {
      const error = new Error('Item not found in shopping list');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    const newQty = Math.max(1, parseInt(quantity, 10) || 1);
    item.quantity = newQty;
    item.subtotal = Number((item.price * newQty).toFixed(2));

    list.recalculateTotal();
    await list.save();

    return await this.getListById(list._id);
  }

  /**
   * Remove an item from a shopping list
   */
  async removeItemFromList(listId, itemId) {
    const list = await ShoppingList.findById(listId);
    if (!list) {
      const error = new Error('Shopping list not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    const item = list.items.id(itemId);
    if (!item) {
      const error = new Error('Item not found in shopping list');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }

    list.items.pull(itemId);
    list.recalculateTotal();
    await list.save();

    return await this.getListById(list._id);
  }

  /**
   * Delete a shopping list by ID
   */
  async deleteList(listId) {
    const list = await ShoppingList.findByIdAndDelete(listId);
    if (!list) {
      const error = new Error('Shopping list not found');
      error.statusCode = 404;
      error.isOperational = true;
      throw error;
    }
    return list;
  }
}

module.exports = new ShoppingListService();
