const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const shoppingListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shopping list name is required'],
      trim: true,
      default: 'My Shopping List',
    },
    items: [shoppingListItemSchema],
    total: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Method to recalculate subtotals and list total
 */
shoppingListSchema.methods.recalculateTotal = function () {
  this.items.forEach((item) => {
    item.subtotal = Number((item.price * item.quantity).toFixed(2));
  });

  const sum = this.items.reduce((acc, item) => acc + item.subtotal, 0);
  this.total = Number(sum.toFixed(2));
};

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;
