const http = require('http');
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = 5001; // use separate port for testing
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            raw: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting API Endpoint Tests ---');
  await connectDB();
  server = app.listen(PORT);

  try {
    // 1. Health Check
    console.log('\n[1] Testing GET /api/health');
    const health = await request('GET', '/api/health');
    console.log('Status:', health.status, 'Body:', health.body);
    if (health.status !== 200 || !health.body.success) throw new Error('Health check failed');

    // 2. Barcode Lookup (Existing)
    console.log('\n[2] Testing GET /api/products/barcode/8901234567890');
    const productLookup = await request('GET', '/api/products/barcode/8901234567890');
    console.log('Status:', productLookup.status, 'Product:', productLookup.body.data?.name);
    if (productLookup.status !== 200 || productLookup.body.data.barcode !== '8901234567890') {
      throw new Error('Barcode lookup failed');
    }

    // 3. Barcode Lookup (Not Found)
    console.log('\n[3] Testing GET /api/products/barcode/0000000000000 (Expect exists: false)');
    const notFoundLookup = await request('GET', '/api/products/barcode/0000000000000');
    console.log('Status:', notFoundLookup.status, 'Body:', notFoundLookup.body);
    if (notFoundLookup.status !== 200 || notFoundLookup.body.exists !== false) throw new Error('Expected exists: false for missing barcode');

    // 4. Products list & Search
    console.log('\n[4] Testing GET /api/products?search=butter');
    const searchRes = await request('GET', '/api/products?search=butter');
    console.log('Status:', searchRes.status, 'Found:', searchRes.body.data?.length, 'items');

    // 5. Product Creation
    console.log('\n[5] Testing POST /api/products');
    const newProduct = {
      barcode: '9999999999999',
      name: 'Test Energy Drink',
      brand: 'Test Brand',
      category: 'Beverages',
      price: 99.50,
      unit: '250ml',
    };
    const createRes = await request('POST', '/api/products', newProduct);
    console.log('Status:', createRes.status, 'Created ID:', createRes.body.product?._id || createRes.body.data?._id);
    const createdProductId = createRes.body.product?._id || createRes.body.data?._id;

    // 5b. Duplicate Barcode Rejection
    console.log('\n[5b] Testing POST /api/products (Duplicate barcode, expect 409)');
    const duplicateRes = await request('POST', '/api/products', newProduct);
    console.log('Status:', duplicateRes.status, 'Message:', duplicateRes.body.message);
    if (duplicateRes.status !== 409 || duplicateRes.body.success !== false) {
      throw new Error('Expected 409 duplicate barcode rejection');
    }

    // 6. Shopping List Creation
    console.log('\n[6] Testing POST /api/shopping-lists');
    const listRes = await request('POST', '/api/shopping-lists', { name: 'Weekend Grocery' });
    console.log('Status:', listRes.status, 'List ID:', listRes.body.data?._id);
    const listId = listRes.body.data?._id;

    // 7. Add Item to Shopping List by Barcode
    console.log(`\n[7] Testing POST /api/shopping-lists/${listId}/items`);
    const addItemRes1 = await request('POST', `/api/shopping-lists/${listId}/items`, {
      barcode: '8901234567890',
      quantity: 2,
    });
    console.log('Status:', addItemRes1.status, 'Items in list:', addItemRes1.body.data?.items.length, 'Total:', addItemRes1.body.data?.total);

    // 8. Add Same Item Again (Should increase quantity to 3)
    console.log(`\n[8] Testing Add Same Item again (Increment Qty)`);
    const addItemRes2 = await request('POST', `/api/shopping-lists/${listId}/items`, {
      barcode: '8901234567890',
      quantity: 1,
    });
    const updatedItem = addItemRes2.body.data?.items[0];
    console.log('Status:', addItemRes2.status, 'Item Qty:', updatedItem?.quantity, 'Subtotal:', updatedItem?.subtotal, 'Total:', addItemRes2.body.data?.total);
    if (updatedItem?.quantity !== 3 || addItemRes2.body.data?.total !== 105) {
      throw new Error('Price calculation / quantity increment failed');
    }

    // 9. Update Item Quantity
    console.log(`\n[9] Testing PUT /api/shopping-lists/${listId}/items/${updatedItem._id}`);
    const updateQtyRes = await request('PUT', `/api/shopping-lists/${listId}/items/${updatedItem._id}`, {
      quantity: 1,
    });
    console.log('Status:', updateQtyRes.status, 'Updated Qty:', updateQtyRes.body.data?.items[0].quantity, 'New Total:', updateQtyRes.body.data?.total);

    // 10. Remove Item
    console.log(`\n[10] Testing DELETE /api/shopping-lists/${listId}/items/${updatedItem._id}`);
    const removeItemRes = await request('DELETE', `/api/shopping-lists/${listId}/items/${updatedItem._id}`);
    console.log('Status:', removeItemRes.status, 'Remaining items:', removeItemRes.body.data?.items.length, 'Total:', removeItemRes.body.data?.total);

    // 11. Clean up Created List and Product
    console.log('\n[11] Clean up test data');
    await request('DELETE', `/api/shopping-lists/${listId}`);
    await request('DELETE', `/api/products/${createdProductId}`);

    console.log('\n=========================================');
    console.log('🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
