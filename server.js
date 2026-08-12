const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins (for Render deployment)
// Allow all origins (required for Render)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    products: [
      { id: 1, name: 'Classic Sofa', price: '850,000 UGX', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop' },
      { id: 2, name: 'Dining Table', price: '1,200,000 UGX', image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop' },
      { id: 3, name: 'Luxury Bed', price: '1,500,000 UGX', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop' },
      { id: 4, name: 'Bookshelf', price: '620,000 UGX', image: 'https://images.unsplash.com/photo-1597019558926-3a6d8b9b2b7b?w=400&h=300&fit=crop' }
    ],
    orders: [],
    users: [
      { id: 1, name: 'Admin', username: 'admin', password: 'admin123', role: 'admin', phone: '+256701681381', email: 'admin@legitfurniture.ug' }
    ],
    settings: {
      businessName: 'LEGIT FURNITURE',
      phone: '+256701681381',
      location: 'MUTOONGO-KIGO',
      email: 'info@legitfurniture.ug',
      whatsapp: '+256701681381',
      tiktok: 'legitfurniture',
      facebook: 'legitfurniture',
      instagram: 'legitfurniture',
      deliveryInfo: 'Free delivery within MUTOONGO-KIGO area',
      warrantyInfo: '1-year warranty on all products'
    },
    nextProductId: 5,
    nextOrderId: 1,
    nextUserId: 2
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading data:', err);
    return null;
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing data:', err);
    return false;
  }
}

// ===== API ROUTES =====

// Get all products
app.get('/api/products', (req, res) => {
  const data = readData();
  res.json(data.products || []);
});

// Add product
app.post('/api/products', (req, res) => {
  const data = readData();
  const { name, price, image } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price required' });
  }
  
  const product = {
    id: data.nextProductId++,
    name: name,
    price: price,
    image: image || 'https://via.placeholder.com/400x300/eee5dd/8b6b55?text=+'
  };
  
  data.products.push(product);
  writeData(data);
  res.json({ success: true, product });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  
  data.products = data.products.filter(p => p.id !== id);
  writeData(data);
  res.json({ success: true });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  const data = readData();
  res.json(data.orders || []);
});

// Place order
app.post('/api/orders', (req, res) => {
  const data = readData();
  const { productId, productName, price, image, client, clientId, clientPhone } = req.body;
  
  const order = {
    id: data.nextOrderId++,
    productId,
    productName,
    price,
    image,
    client: client || 'Guest',
    clientId: clientId || 0,
    clientPhone: clientPhone || 'N/A',
    date: new Date().toLocaleString(),
    status: 'pending'
  };
  
  data.orders.push(order);
  writeData(data);
  res.json({ success: true, order });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  const order = data.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    writeData(data);
    res.json({ success: true, order });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Get users
app.get('/api/users', (req, res) => {
  const data = readData();
  res.json(data.users || []);
});

// Register user
app.post('/api/users', (req, res) => {
  const data = readData();
  const { name, username, password, phone, email } = req.body;
  
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  const user = {
    id: data.nextUserId++,
    name: name,
    username: username,
    password: password,
    role: 'client',
    phone: phone || 'N/A',
    email: email || 'N/A'
  };
  
  data.users.push(user);
  writeData(data);
  res.json({ success: true, user });
});

// Get settings
app.get('/api/settings', (req, res) => {
  const data = readData();
  res.json(data.settings || {});
});

// Update settings
app.put('/api/settings', (req, res) => {
  const data = readData();
  const settings = req.body;
  data.settings = { ...data.settings, ...settings };
  writeData(data);
  res.json({ success: true, settings: data.settings });
});

// Login user
app.post('/api/login', (req, res) => {
  const data = readData();
  const { username, password } = req.body;
  
  const user = data.users.find(u => u.username === username && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Test route to check if API is working
app.get('/api/test', (req, res) => {
  res.json({ 
    status: '✅ API is working!', 
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LEGIT FURNITURE Backend running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  console.log(`🌐 Access from any device at your IP:${PORT}`);
});
