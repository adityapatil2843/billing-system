require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');
const connectDB = require('./config/db');

const sampleProducts = [
  {
    barcode: '8901234567890',
    name: 'Britannia Good Day Cookies',
    brand: 'Britannia',
    category: 'Food & Snacks',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
    unit: '100g',
    description: 'Rich butter cookies topped with cashew and almonds.',
  },
  {
    barcode: '8901030383456',
    name: 'Amul Butter Salted',
    brand: 'Amul',
    category: 'Dairy',
    price: 56.00,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500',
    unit: '100g',
    description: 'Pasteurized salted table butter from pure milk.',
  },
  {
    barcode: '8901058852309',
    name: 'Maggi 2-Minute Noodles Masala',
    brand: 'Nestle',
    category: 'Instant Food',
    price: 14.00,
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500',
    unit: '70g',
    description: 'Instant noodles with authentic Indian masala flavor.',
  },
  {
    barcode: '8901491101837',
    name: 'Lays India\'s Magic Masala',
    brand: 'Lays',
    category: 'Snacks',
    price: 20.00,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500',
    unit: '50g',
    description: 'Crispy potato chips seasoned with aromatic Indian spices.',
  },
  {
    barcode: '8901725181222',
    name: 'Tata Tea Gold',
    brand: 'Tata',
    category: 'Beverages',
    price: 140.00,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500',
    unit: '250g',
    description: 'Exquisite blend of Assam CTC teas with long leaves for rich aroma.',
  },
  {
    barcode: '8901063012644',
    name: 'Colgate Strong Teeth Toothpaste',
    brand: 'Colgate',
    category: 'Personal Care',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1559591937-e1032b9064c5?w=500',
    unit: '100g',
    description: 'Calcium boost formula for stronger teeth and cavity protection.',
  },
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing products...');
    await Product.deleteMany({});

    console.log('[Seed] Inserting sample products...');
    const inserted = await Product.insertMany(sampleProducts);

    console.log(`[Seed] Successfully seeded ${inserted.length} products:`);
    inserted.forEach((p) => {
      console.log(`  - [${p.barcode}] ${p.name} (Rs. ${p.price})`);
    });

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
