const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ── DATABASE SETUP ──────────────────────────────────────────────────────────
const dbPath = process.env.DB_PATH || path.join(__dirname, 'orders.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    sort_order  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    description TEXT    DEFAULT '',
    price       REAL    NOT NULL,
    available   INTEGER DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number  INTEGER NOT NULL,
    customer_name TEXT    DEFAULT '',
    customer_phone TEXT   DEFAULT '',
    status        TEXT    DEFAULT 'pending',
    notes         TEXT    DEFAULT '',
    total         REAL    DEFAULT 0,
    created_at    TEXT    DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL,
    item_id     INTEGER NOT NULL,
    item_name   TEXT    NOT NULL,
    item_price  REAL    NOT NULL,
    quantity    INTEGER DEFAULT 1,
    notes       TEXT    DEFAULT '',
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// ── SEED DEFAULT MENU ───────────────────────────────────────────────────────
const { count: catCount } = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount === 0) {
  const addCat  = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const addItem = db.prepare('INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)');

  const hotCoffee    = addCat.run('Hot Coffee', 1).lastInsertRowid;
  const hotSpecials  = addCat.run('Hot Specials', 2).lastInsertRowid;
  const siestaSp     = addCat.run('Siesta Specials', 3).lastInsertRowid;
  const coldBrew     = addCat.run('Cold Brew', 4).lastInsertRowid;
  const frappe       = addCat.run('Frappe', 5).lastInsertRowid;
  const icedCoffee   = addCat.run('Iced Coffee', 6).lastInsertRowid;
  const milkshakes   = addCat.run('Milkshakes', 7).lastInsertRowid;
  const mojito       = addCat.run('Mojito', 8).lastInsertRowid;
  const icedTea      = addCat.run('Iced Tea', 9).lastInsertRowid;
  const food         = addCat.run('Food', 10).lastInsertRowid;
  const riceBowls    = addCat.run('Rice Bowls', 11).lastInsertRowid;
  const sweets       = addCat.run('Sweets', 12).lastInsertRowid;
  const packaged     = addCat.run('Packaged Drinks', 13).lastInsertRowid;
  const desserts     = addCat.run('Desserts', 14).lastInsertRowid;

  // Hot Coffee
  addItem.run(hotCoffee, 'Espresso',       'Single shot, freshly pulled',          120);
  addItem.run(hotCoffee, 'Doppio',         'Double espresso shot',                 140);
  addItem.run(hotCoffee, 'Americano',      'Espresso with hot water',              150);
  addItem.run(hotCoffee, 'Cortado',        'Espresso with equal parts warm milk',  160);
  addItem.run(hotCoffee, 'Cappuccino',     'Espresso with steamed milk foam',      170);
  addItem.run(hotCoffee, 'Cafe Latte',     'Espresso with steamed milk',           170);
  addItem.run(hotCoffee, 'Flat White',     'Velvety microfoam espresso',           170);
  addItem.run(hotCoffee, 'Mocha',          'Espresso with chocolate & milk',       180);

  // Hot Specials
  addItem.run(hotSpecials, 'Vietnames Latte',        'Condensed milk & robusta espresso',   200);
  addItem.run(hotSpecials, 'Spanish Latte',           'Espresso with condensed & fresh milk',200);
  addItem.run(hotSpecials, 'French Vanilla Latte',    'Smooth vanilla-infused latte',        200);
  addItem.run(hotSpecials, 'White Chocolate',         'Espresso with white chocolate sauce', 200);
  addItem.run(hotSpecials, 'Roasted Hazelnut Latte',  'Latte with roasted hazelnut syrup',   200);

  // Siesta Specials
  addItem.run(siestaSp, 'Salted Caramel Latte',  'Iced espresso with salted caramel',    220);
  addItem.run(siestaSp, 'French Toast Latte',    'Cinnamon & maple iced latte',          220);
  addItem.run(siestaSp, 'Tiramisu Latte',        'Mascarpone & espresso iced latte',     250);
  addItem.run(siestaSp, 'Bonafee Latte',         'Caramel banana iced latte',            240);

  // Cold Brew
  addItem.run(coldBrew, 'Straight Up',                 'Classic slow-steeped cold brew',         150);
  addItem.run(coldBrew, 'Siesta Basil',                'Cold brew with fresh basil',             200);
  addItem.run(coldBrew, 'Coldbrew Gingerale / Tonic',  'Cold brew with ginger ale or tonic',     180);
  addItem.run(coldBrew, 'Coconut Cloud',               'Cold brew with coconut milk foam',       240);
  addItem.run(coldBrew, 'Yuzu',                        'Cold brew with yuzu citrus',             220);
  addItem.run(coldBrew, 'Berry Coldbrew',              'Cold brew with mixed berry syrup',       200);
  addItem.run(coldBrew, 'Lavender Coldbrew',           'Cold brew with lavender infusion',       200);
  addItem.run(coldBrew, 'Fridge Cigarette Coffee',     'Smoked cold brew, house specialty',      240);

  // Frappe
  addItem.run(frappe, 'Classic Frappe',    'Blended coffee frappe · add-ons: Caramel/Hazelnut/Vanilla', 190);
  addItem.run(frappe, 'Mocha Frappe',      'Chocolate & coffee blended frappe',    220);
  addItem.run(frappe, 'Ferreo Frappe',     'Ferrero-inspired hazelnut frappe',      220);
  addItem.run(frappe, 'Salted Caramel',    'Caramel & salt blended frappe',         220);
  addItem.run(frappe, 'Tiramisu Frappe',   'Mascarpone & espresso frappe',          240);
  addItem.run(frappe, 'Brownie Frappe',    'Rich chocolate brownie frappe',         240);

  // Iced Coffee
  addItem.run(icedCoffee, 'Iced Latte',              'Espresso over ice with milk · Caramel/Vanilla', 170);
  addItem.run(icedCoffee, 'Iced Americano',          'Espresso over ice with water',         160);
  addItem.run(icedCoffee, 'Iced Mocha',              'Espresso, chocolate & ice',             190);
  addItem.run(icedCoffee, 'Iced Vietnames Latte',    'Condensed milk iced espresso',          200);
  addItem.run(icedCoffee, 'Iced Spanish Latte',      'Condensed & fresh milk iced espresso',  200);
  addItem.run(icedCoffee, 'French Vanilla Iced',     'Smooth vanilla iced latte',             200);
  addItem.run(icedCoffee, 'Roasted Hazelnut Iced',   'Hazelnut syrup iced latte',             200);
  addItem.run(icedCoffee, 'Cranberry Espresso',      'Espresso with cranberry over ice',      200);
  addItem.run(icedCoffee, 'Orange Sunrise',          'Espresso with orange & ice',            220);

  // Milkshakes
  addItem.run(milkshakes, 'Cookie Crumble',  'Blended cookie milkshake',   220);
  addItem.run(milkshakes, 'Strawberry',      'Fresh strawberry milkshake',  220);
  addItem.run(milkshakes, 'Mango',           'Fresh mango milkshake',       220);
  addItem.run(milkshakes, 'Blueberry',       'Fresh blueberry milkshake',   220);

  // Mojito
  addItem.run(mojito, 'Virgin Mojito',  'Lime, mint, soda, sugar',             180);
  addItem.run(mojito, 'Watermelon',     'Watermelon mojito with mint & lime',  180);
  addItem.run(mojito, 'Jamun Spritz',   'Jamun & lime sparkling mojito',       180);
  addItem.run(mojito, 'Blueberry',      'Blueberry mint mojito',               180);
  addItem.run(mojito, 'Mango Berry',    'Mango & berry mojito',                180);
  addItem.run(mojito, 'Rasberry',       'Fresh raspberry mojito',              180);

  // Iced Tea
  addItem.run(icedTea, 'Lemon',    'Classic lemon iced tea',   180);
  addItem.run(icedTea, 'Peach',    'Sweet peach iced tea',     180);
  addItem.run(icedTea, 'Hibiscus', 'Floral hibiscus iced tea', 180);

  // Food
  addItem.run(food, 'Andhra Chicken Pita',      'Spicy Andhra-style chicken in pita bread',   350);
  addItem.run(food, 'Thecha Chicken Wings',     'Crispy wings with green chilli thecha',       320);
  addItem.run(food, 'Kung Pao Chicken',         'Stir-fried chicken with peanuts & chilli',    300);
  addItem.run(food, 'Paneer 65',                'Crispy spiced paneer bites',                  320);
  addItem.run(food, 'Chicken Tender',           'Juicy breaded chicken tenders',               280);
  addItem.run(food, 'Chicken Keema Sandwich',   'Spiced chicken mince in a toasted bun',       320);
  addItem.run(food, 'Spicy Bombay Sandwich',    'Masala veggies, chutney & cheese',            280);
  addItem.run(food, 'Veg Keema Sandos',         'Spiced soy keema in a Japanese-style bun',    280);
  addItem.run(food, 'Thecha Spaghetti',         'Spaghetti with fiery green chilli thecha',    350);
  addItem.run(food, 'Alfredo Pasta',            'Creamy Alfredo sauce · add chicken +₹50',     280);
  addItem.run(food, 'Arrabbiata Pasta',         'Spicy tomato sauce pasta · add chicken +₹50', 280);
  addItem.run(food, 'Mexican Samosa Chaat',     'Crispy samosa with Mexican toppings',         220);
  addItem.run(food, 'Avocado Toasties',         'Smashed avocado on toasted sourdough',        300);
  addItem.run(food, 'Chilli Cheese Toasties',   'Melted cheese with green chilli toast',       300);
  addItem.run(food, 'Creamy Veggie Toasties',   'Creamy vegetable filling on toast',           300);
  addItem.run(food, 'Creamy Chicken Toasties',  'Creamy chicken filling on toast',             300);
  addItem.run(food, 'Siesta Fries',             'Seasoned house-style fries',                  200);

  // Rice Bowls
  addItem.run(riceBowls, 'Saoji Rice Bowl',            'Fiery Nagpur-style Saoji chicken curry with rice', 320);
  addItem.run(riceBowls, 'Makhani Chicken Rice Bowl',  'Butter chicken gravy over steamed rice',           320);
  addItem.run(riceBowls, 'Makhani Paneer Rice Bowl',   'Butter paneer gravy over steamed rice',            300);
  addItem.run(riceBowls, 'Mexican Rice Bowl',          'Spiced Mexican-style rice with salsa & beans',     280);
  addItem.run(riceBowls, 'Oriental Rice Bowl',         'Stir-fried Oriental veggies with rice',            280);

  // Sweets
  addItem.run(sweets, 'Mango Smoothie Bowl',    'Fresh mango, granola & toppings',      260);
  addItem.run(sweets, 'Blueberry Smoothie Bowl','Fresh blueberry, granola & toppings',  260);

  // Packaged Drinks
  addItem.run(packaged, 'Water Bottle', 'Still water 500ml',  40);
  addItem.run(packaged, 'Redbull',      'Energy drink 250ml', 180);
  addItem.run(packaged, 'Diet Coke',    'Diet Coke 300ml',    70);

  // Desserts
  addItem.run(desserts, 'Mango Tres Leches',     'Light sponge cake soaked in flavored milk, topped with fresh Alphonso Mangoes', 390);
  addItem.run(desserts, 'Mango Misu',            'Fruity tiramisu with layers of soft biscuits, creamy filling and sweet mango puree', 360);
  addItem.run(desserts, 'Tiramisu',              'Ladyfinger biscuits soaked in espresso, layered with mascarpone and Belgian cocoa', 330);
  addItem.run(desserts, 'Chocolate Croissant',   'Golden layered croissant filled with luscious chocolate, crisp outside & soft inside', 290);
  addItem.run(desserts, 'Belgian Chocolate Cake','Decadent Belgian chocolate cake with intense cocoa taste', 290);
}

// ── OTP STORE (in-memory, expires in 10 min) ─────────────────────────────────
const otpStore = new Map(); // phone → { otp, expiresAt, verified }

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTPviaMSG91(phone) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.warn('[MSG91] Missing MSG91_AUTH_KEY env var');
    return false;
  }
  const mobile = `91${phone}`;
  const message = encodeURIComponent(`Your OTP for La Siesta is ##OTP##. Valid for 10 minutes.`);
  const url = `https://api.msg91.com/api/sendotp.php?authkey=${authKey}&mobile=${mobile}&message=${message}&sender=LSIEST&otp_length=6&otp_expiry=10`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('[MSG91 send]', JSON.stringify(data));
  return data.type === 'success';
}

async function verifyOTPviaMSG91(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) return false;
  const mobile = `91${phone}`;
  const url = `https://api.msg91.com/api/verifyRequestOTP.php?authkey=${authKey}&mobile=${mobile}&otp=${otp}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('[MSG91 verify]', JSON.stringify(data));
  return data.type === 'success';
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Landing page at root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Menu/ordering page
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'public', 'menu.html')));

// ── MENU API ─────────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const cats  = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const items = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY category_id, name').all();
  res.json(cats.map(c => ({ ...c, items: items.filter(i => i.category_id === c.id) })));
});

// ── OTP API ──────────────────────────────────────────────────────────────────
app.post('/api/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number' });
  }
  try {
    const sent = await sendOTPviaMSG91(phone);
    if (!sent) return res.status(500).json({ error: 'Failed to send OTP. Check MSG91 credentials.' });
    // Track that OTP was sent (MSG91 stores the OTP on their end)
    otpStore.set(phone, { expiresAt: Date.now() + 10 * 60 * 1000, verified: false });
    res.json({ success: true });
  } catch (e) {
    console.error('[OTP send error]', e);
    res.status(500).json({ error: 'Failed to send OTP. Try again.' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  const record = otpStore.get(phone);
  if (!record) return res.status(400).json({ error: 'No OTP sent for this number' });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired. Request a new one.' });
  }
  try {
    const valid = await verifyOTPviaMSG91(phone, otp);
    if (!valid) return res.status(400).json({ error: 'Incorrect OTP' });
    record.verified = true;
    res.json({ success: true });
  } catch (e) {
    console.error('[OTP verify error]', e);
    res.status(500).json({ error: 'Verification failed. Try again.' });
  }
});

// ── ORDER API ────────────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { table_number, customer_name, customer_phone, notes, items } = req.body;
  if (!table_number || !items?.length) {
    return res.status(400).json({ error: 'table_number and items are required' });
  }
  if (!customer_phone || !/^[6-9]\d{9}$/.test(customer_phone)) {
    return res.status(400).json({ error: 'A verified phone number is required' });
  }
  const record = otpStore.get(customer_phone);
  if (!record?.verified) {
    return res.status(400).json({ error: 'Phone number not verified. Please verify via OTP.' });
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const insertOrder = db.prepare(
    'INSERT INTO orders (table_number, customer_name, customer_phone, notes, total) VALUES (?, ?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );

  let orderId;
  db.exec('BEGIN');
  try {
    const { lastInsertRowid } = insertOrder.run(table_number, customer_name || '', customer_phone, notes || '', total);
    for (const item of items) {
      insertItem.run(lastInsertRowid, item.id, item.name, item.price, item.quantity, item.notes || '');
    }
    orderId = lastInsertRowid;
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  otpStore.delete(customer_phone); // consume verification
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  io.emit('new_order', order);
  res.json({ success: true, order_id: orderId });
});

app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  const rows = status && status !== 'all'
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();

  for (const o of rows) {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  }
  res.json(rows);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'preparing', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  order.items  = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  io.emit('order_updated', order);
  res.json(order);
});

// ── ADMIN API ────────────────────────────────────────────────────────────────
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'lasiesta2024';

app.post('/api/admin/login', (req, res) => {
  req.body.password === ADMIN_PASS
    ? res.json({ success: true })
    : res.status(401).json({ error: 'Wrong password' });
});

app.get('/api/admin/menu', (req, res) => {
  const cats  = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, name').all();
  res.json(cats.map(c => ({ ...c, items: items.filter(i => i.category_id === c.id) })));
});

app.post('/api/admin/categories', (req, res) => {
  const { name } = req.body;
  const { max } = db.prepare('SELECT MAX(sort_order) as max FROM categories').get();
  const { lastInsertRowid: id } = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, (max || 0) + 1);
  res.json({ id, name, sort_order: (max || 0) + 1 });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE category_id = ?').run(req.params.id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/items', (req, res) => {
  const { category_id, name, description, price } = req.body;
  const { lastInsertRowid: id } = db.prepare(
    'INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)'
  ).run(category_id, name, description || '', price);
  res.json({ id, category_id, name, description, price, available: 1 });
});

app.put('/api/admin/items/:id', (req, res) => {
  const { name, description, price, available } = req.body;
  db.prepare(
    'UPDATE menu_items SET name = ?, description = ?, price = ?, available = ? WHERE id = ?'
  ).run(name, description, price, available ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/items/:id', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.patch('/api/admin/items/:id/toggle', (req, res) => {
  const item = db.prepare('SELECT available FROM menu_items WHERE id = ?').get(req.params.id);
  const next = item.available ? 0 : 1;
  db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(next, req.params.id);
  res.json({ available: next });
});

// ── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`[socket] connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`La Siesta ordering server → http://localhost:${PORT}`));
