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
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  }
});

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
  const icedCoffee   = addCat.run('Iced Coffee', 3).lastInsertRowid;
  const icedSpecials = addCat.run('Iced Specials', 4).lastInsertRowid;
  const coldBrew     = addCat.run('Cold Brew', 5).lastInsertRowid;
  const frappe       = addCat.run('Frappe', 6).lastInsertRowid;
  const mojito       = addCat.run('Mojito', 7).lastInsertRowid;
  const milkshakes   = addCat.run('Milkshakes', 8).lastInsertRowid;
  const icedTea      = addCat.run('Iced Tea', 9).lastInsertRowid;
  const matcha          = addCat.run('Matcha', 10).lastInsertRowid;
  const packaged        = addCat.run('Packaged Drinks', 11).lastInsertRowid;
  const globalFusions   = addCat.run('Global Fusions', 12).lastInsertRowid;
  const toasties        = addCat.run('Toasties', 13).lastInsertRowid;
  const pasta           = addCat.run('Pasta', 14).lastInsertRowid;
  const sandwiches      = addCat.run('Sandwiches', 15).lastInsertRowid;
  const mains           = addCat.run('Mains', 16).lastInsertRowid;
  const riceBowls       = addCat.run('Special Rice Bowls', 17).lastInsertRowid;
  const sides           = addCat.run('Sides', 18).lastInsertRowid;
  const sweets          = addCat.run('Sweet', 19).lastInsertRowid;
  const desserts        = addCat.run('Desserts', 20).lastInsertRowid;

  // Hot Coffee
  addItem.run(hotCoffee, 'Espresso',       'Single shot, freshly pulled',         120);
  addItem.run(hotCoffee, 'Doppio',         'Double espresso shot',                140);
  addItem.run(hotCoffee, 'Americano',      'Espresso with hot water',             150);
  addItem.run(hotCoffee, 'Cortado',        'Espresso with equal parts warm milk', 160);
  addItem.run(hotCoffee, 'Cappuccino',     'Espresso with steamed milk foam',     170);
  addItem.run(hotCoffee, 'Cafe Latte',     'Espresso with steamed milk',          170);
  addItem.run(hotCoffee, 'Flat White',     'Velvety microfoam espresso',          170);
  addItem.run(hotCoffee, 'Mocha',          'Espresso with chocolate & milk',      180);

  // Hot Specials
  addItem.run(hotSpecials, 'Vietnames Latte',       'Condensed milk & robusta espresso',    200);
  addItem.run(hotSpecials, 'Spanish Latte',          'Espresso with condensed & fresh milk', 200);
  addItem.run(hotSpecials, 'French Vanilla Latte',   'Smooth vanilla-infused latte',         200);
  addItem.run(hotSpecials, 'White Chocolate',        'Espresso with white chocolate sauce',  200);
  addItem.run(hotSpecials, 'Roasted Hazelnut Latte', 'Latte with roasted hazelnut syrup',    200);

  // Iced Coffee — basic + specialty lattes
  addItem.run(icedCoffee, 'Iced Latte',           'Espresso over ice with milk · add-ons: Caramel/Vanilla', 170);
  addItem.run(icedCoffee, 'Iced Americano',       'Espresso over ice with water',             160);
  addItem.run(icedCoffee, 'Iced Mocha',           'Espresso, chocolate & ice',                190);
  addItem.run(icedCoffee, 'Salted Caramel Latte', 'Iced espresso with salted caramel',        220);
  addItem.run(icedCoffee, 'French Toast Latte',   'Cinnamon & maple iced latte',              220);
  addItem.run(icedCoffee, 'Tiramisu Latte',       'Mascarpone & espresso iced latte',         250);
  addItem.run(icedCoffee, 'Bonafee Latte',        'Caramel banana iced latte',                240);
  addItem.run(icedCoffee, 'Coconut Cloud',        'Iced espresso with coconut milk foam',     240);

  // Iced Specials
  addItem.run(icedSpecials, 'Vietnames Latte',       'Condensed milk iced espresso',           200);
  addItem.run(icedSpecials, 'Spanish Latte',          'Condensed & fresh milk iced espresso',   200);
  addItem.run(icedSpecials, 'French Vanilla Latte',   'Smooth vanilla iced latte',              200);
  addItem.run(icedSpecials, 'Roasted Hazelnut Latte', 'Hazelnut syrup iced latte',              200);
  addItem.run(icedSpecials, 'Cranberry Espresso',     'Espresso with cranberry over ice',       200);
  addItem.run(icedSpecials, 'Orange Sunrise',         'Espresso with fresh orange over ice',    220);

  // Cold Brew
  addItem.run(coldBrew, 'Straight Up',                'Classic slow-steeped cold brew',        150);
  addItem.run(coldBrew, 'Siesta Basil',               'Cold brew with fresh basil',            200);
  addItem.run(coldBrew, 'Coldbrew Gingerale / Tonic', 'Cold brew with ginger ale or tonic',    180);
  addItem.run(coldBrew, 'Yuzu',                       'Cold brew with yuzu citrus',            220);
  addItem.run(coldBrew, 'Berry Coldbrew',             'Cold brew with mixed berry syrup',      200);
  addItem.run(coldBrew, 'Lavender Coldbrew',          'Cold brew with lavender infusion',      200);
  addItem.run(coldBrew, 'Fridge Cigarette Coffee',    'Smoked cold brew, house specialty',     240);

  // Frappe
  addItem.run(frappe, 'Classic Frappe',   'Blended coffee frappe · add-ons: Caramel/Hazelnut/Vanilla', 190);
  addItem.run(frappe, 'Mocha Frappe',     'Chocolate & coffee blended frappe',  220);
  addItem.run(frappe, 'Ferreo Frappe',    'Ferrero-inspired hazelnut frappe',   220);
  addItem.run(frappe, 'Salted Caramel',   'Caramel & salt blended frappe',      220);
  addItem.run(frappe, 'Tiramisu Frappe',  'Mascarpone & espresso frappe',       240);
  addItem.run(frappe, 'Brownie Frappe',   'Rich chocolate brownie frappe',      240);

  // Mojito
  addItem.run(mojito, 'Virgin Mojito', 'Lime, mint, soda, sugar',            180);
  addItem.run(mojito, 'Watermelon',    'Watermelon mojito with mint & lime', 180);
  addItem.run(mojito, 'Jamun Spritz',  'Jamun & lime sparkling mojito',      180);
  addItem.run(mojito, 'Blueberry',     'Blueberry mint mojito',              180);
  addItem.run(mojito, 'Mango Berry',   'Mango & berry mojito',               180);
  addItem.run(mojito, 'Rasberry',      'Fresh raspberry mojito',             180);

  // Milkshakes
  addItem.run(milkshakes, 'Cookie Crumble', 'Blended cookie milkshake',    220);
  addItem.run(milkshakes, 'Strawberry',     'Fresh strawberry milkshake',  220);
  addItem.run(milkshakes, 'Mango',          'Fresh mango milkshake',       220);
  addItem.run(milkshakes, 'Blueberry',      'Fresh blueberry milkshake',   220);

  // Iced Tea
  addItem.run(icedTea, 'Lemon',    'Classic lemon iced tea',   180);
  addItem.run(icedTea, 'Peach',    'Sweet peach iced tea',     180);
  addItem.run(icedTea, 'Hibiscus', 'Floral hibiscus iced tea', 180);

  // Matcha
  addItem.run(matcha, 'Mango Matcha Latte',      'Ceremonial matcha with fresh Alphonso mango',      250);
  addItem.run(matcha, 'Matcha Latte',            'Classic iced matcha with creamy milk',             230);
  addItem.run(matcha, 'Matcha Cloud',            'Iced matcha topped with salted cream cloud foam',  250);
  addItem.run(matcha, 'Strawberry Matcha Latte', 'Matcha layered with fresh strawberry purée',       250);

  // Packaged Drinks
  addItem.run(packaged, 'Water Bottle', 'Still water 500ml',  40);
  addItem.run(packaged, 'Redbull',      'Energy drink 250ml', 180);
  addItem.run(packaged, 'Diet Coke',    'Diet Coke 300ml',    70);

  // Global Fusions
  addItem.run(globalFusions, 'Andhra Chicken Pita',   'Spicy Andhra-style chicken in pita bread',  380);
  addItem.run(globalFusions, 'Paneer Fingers',        'Crispy golden paneer fingers',               380);
  addItem.run(globalFusions, 'Thecha Spaghetti',      'Spaghetti with fiery green chilli thecha',   360);
  addItem.run(globalFusions, 'Thecha Chicken Wings',  'Crispy wings with green chilli thecha',      360);
  addItem.run(globalFusions, 'Kung Pao Chicken',      'Stir-fried chicken with peanuts & chilli',   360);
  addItem.run(globalFusions, 'Mexican Samosa Chaat',  'Crispy samosa with Mexican toppings',        300);

  // Toasties
  addItem.run(toasties, 'Avocado Toasties',         'Smashed avocado on toasted sourdough',      300);
  addItem.run(toasties, 'Chilli Cheese Toasties',   'Melted cheese with green chilli toast',     300);
  addItem.run(toasties, 'Creamy Veggie Toasties',   'Creamy vegetable filling on toast',         300);
  addItem.run(toasties, 'Creamy Mushroom Toasties', 'Creamy mushroom filling on toast',          300);
  addItem.run(toasties, 'Creamy Chicken Toasties',  'Creamy chicken filling on toast',           300);

  // Pasta
  addItem.run(pasta, 'Aglio Olio',       'Garlic & olive oil spaghetti · add chicken +₹50',  330);
  addItem.run(pasta, 'Pesto Pasta',      'Fresh basil pesto pasta · add chicken +₹50',        330);
  addItem.run(pasta, 'Pink Sauce Pasta', 'Creamy tomato pink sauce · add chicken +₹50',       320);
  addItem.run(pasta, 'Alfredo Pasta',    'Creamy Alfredo sauce · add chicken +₹50',           300);
  addItem.run(pasta, 'Arrabbiata Pasta', 'Spicy tomato sauce pasta · add chicken +₹50',       300);

  // Sandwiches
  addItem.run(sandwiches, 'Chicken Keema',     'Spiced chicken mince in a toasted bun',           330);
  addItem.run(sandwiches, 'Truffle Mushroom',  'Truffle oil & mushroom in toasted sourdough',     330);
  addItem.run(sandwiches, 'Veg Keema Sandos',  'Spiced soy keema in a Japanese-style bun',        300);
  addItem.run(sandwiches, 'Spicy Bombay',      'Masala veggies, chutney & cheese',                280);

  // Mains
  addItem.run(mains, 'Paneer Steak Bowl',     'Grilled paneer steak with sides',              360);
  addItem.run(mains, 'Chicken Steak Bowl',    'Grilled chicken steak with sides',             390);
  addItem.run(mains, 'Pizza Chicken Loaded',  'Loaded pizza with chicken toppings',           450);
  addItem.run(mains, 'Pizza Veggie Loaded',   'Loaded pizza with fresh veggie toppings',      400);

  // Special Rice Bowls
  addItem.run(riceBowls, 'Saoji Rice Bowl',           'Fiery Nagpur-style Saoji chicken curry with rice', 360);
  addItem.run(riceBowls, 'Makhani Chicken Rice Bowl', 'Butter chicken gravy over steamed rice',           360);
  addItem.run(riceBowls, 'Makhani Paneer Rice Bowl',  'Butter paneer gravy over steamed rice',            340);
  addItem.run(riceBowls, 'Mexican Rice Bowl',         'Spiced Mexican-style rice with salsa & beans',     340);
  addItem.run(riceBowls, 'Oriental Rice Bowl',        'Stir-fried Oriental veggies with rice',            340);

  // Sides
  addItem.run(sides, 'Chicken Tender', 'Juicy breaded chicken tenders', 280);
  addItem.run(sides, 'Siesta Fries',   'Seasoned house-style fries',    240);

  // Sweet
  addItem.run(sweets, 'Mango Smoothie Bowl',     'Fresh mango, granola & toppings',                260);
  addItem.run(sweets, 'Blueberry Smoothie Bowl', 'Fresh blueberry, granola & toppings',            260);
  addItem.run(sweets, 'French Toast',            'Golden French toast · add-ons: Nutella/Alphonso mango/Espresso cream/Blueberry', 300);
  addItem.run(sweets, 'Pancakes',                'Fluffy pancakes · add-ons: Nutella/Alphonso mango/Espresso cream/Blueberry',     300);

  // Desserts
  addItem.run(desserts, 'Mango Tres Leches',      'Light sponge cake soaked in flavored milk, topped with fresh Alphonso Mangoes',      390);
  addItem.run(desserts, 'Mango Misu',             'Fruity tiramisu with layers of soft biscuits, creamy filling and sweet mango puree', 360);
  addItem.run(desserts, 'Tiramisu',               'Ladyfinger biscuits soaked in espresso, layered with mascarpone and Belgian cocoa',  330);
  addItem.run(desserts, 'Chocolate Croissant',    'Golden layered croissant filled with luscious chocolate, crisp outside & soft inside',290);
  addItem.run(desserts, 'Belgian Chocolate Cake', 'Decadent Belgian chocolate cake with intense cocoa taste',                           290);
}

// ── MIGRATION: add is_house_special column if missing ───────────────────────
const hsColExists = db.prepare("PRAGMA table_info(menu_items)").all().some(c => c.name === 'is_house_special');
if (!hsColExists) {
  db.prepare("ALTER TABLE menu_items ADD COLUMN is_house_special INTEGER DEFAULT 0").run();
  // Auto-mark known house items by description keyword
  db.prepare("UPDATE menu_items SET is_house_special = 1 WHERE description LIKE '%house%' OR name LIKE 'Siesta%'").run();
  console.log('[Migration] is_house_special column added');
}

// ── MIGRATION: add Matcha category if missing ────────────────────────────────
const matchaExists = db.prepare("SELECT id FROM categories WHERE name = 'Matcha'").get();
if (!matchaExists) {
  const addItem = db.prepare('INSERT INTO menu_items (category_id, name, description, price) VALUES (?, ?, ?, ?)');
  const matchaId = db.prepare("INSERT INTO categories (name, sort_order) VALUES ('Matcha', 10)").run().lastInsertRowid;
  // shift Packaged Drinks and food cats down by 1
  db.prepare("UPDATE categories SET sort_order = sort_order + 1 WHERE sort_order >= 10 AND name != 'Matcha'").run();
  addItem.run(matchaId, 'Mango Matcha Latte',      'Ceremonial matcha with fresh Alphonso mango',      250);
  addItem.run(matchaId, 'Matcha Latte',            'Classic iced matcha with creamy milk',             230);
  addItem.run(matchaId, 'Matcha Cloud',            'Iced matcha topped with salted cream cloud foam',  250);
  addItem.run(matchaId, 'Strawberry Matcha Latte', 'Matcha layered with fresh strawberry purée',       250);
  console.log('[Migration] Matcha category added');
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Landing page at root
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Menu/ordering page
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'public', 'menu.html')));

// Order status tracking page
app.get('/status', (req, res) => res.sendFile(path.join(__dirname, 'public', 'status.html')));

// Admin panel
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Counter / POS dashboard
app.get('/counter', (req, res) => res.sendFile(path.join(__dirname, 'public', 'counter.html')));

// ── MENU API ─────────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const cats  = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const items = db.prepare('SELECT * FROM menu_items ORDER BY category_id, name').all();
  res.json(cats.map(c => ({
    ...c,
    items: items.filter(i => i.category_id === c.id).map(i => ({ ...i, is_available: i.available === 1 }))
  })));
});

// ── SAFE MIGRATIONS ─────────────────────────────────────────────────────────
;(function () {
  const cols = db.prepare('PRAGMA table_info(orders)').all().map(c => c.name);
  if (!cols.includes('discount'))    db.prepare("ALTER TABLE orders ADD COLUMN discount    REAL DEFAULT 0").run();
  if (!cols.includes('tip'))         db.prepare("ALTER TABLE orders ADD COLUMN tip         REAL DEFAULT 0").run();
  if (!cols.includes('waiter_name')) db.prepare("ALTER TABLE orders ADD COLUMN waiter_name TEXT DEFAULT ''").run();
  if (!cols.includes('order_type'))  db.prepare("ALTER TABLE orders ADD COLUMN order_type  TEXT DEFAULT 'indoor'").run();
})();

// ── ORDER API ────────────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { table_number, customer_name, customer_phone, notes, items } = req.body;
  if (!table_number || !items?.length) {
    return res.status(400).json({ error: 'table_number and items are required' });
  }
  // Phone optional for POS; only validate format if provided
  if (customer_phone && !/^[6-9]\d{9}$/.test(customer_phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
  }

  const total = items.reduce((s, i) => s + (i.price || i.item_price) * i.quantity, 0);

  const insertOrder = db.prepare(
    'INSERT INTO orders (table_number, customer_name, customer_phone, notes, total) VALUES (?, ?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );

  let orderId;
  db.exec('BEGIN');
  try {
    const { lastInsertRowid } = insertOrder.run(table_number, customer_name || '', customer_phone || '', notes || '', total);
    for (const item of items) {
      insertItem.run(lastInsertRowid, item.id || item.item_id, item.name || item.item_name || '', item.price || item.item_price, item.quantity, item.notes || '');
    }
    orderId = lastInsertRowid;
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  const { cnt: activeCount } = db.prepare(
    "SELECT COUNT(*) as cnt FROM orders WHERE status IN ('pending','preparing') AND id != ?"
  ).get(orderId);
  const waitMinutes = Math.max(5, activeCount * 4 + 5);

  io.emit('new_order', order);
  res.json({ success: true, order_id: orderId, wait_minutes: waitMinutes, order });
});

app.get('/api/orders', (req, res) => {
  const { status, table } = req.query;
  let rows;
  if (table) {
    rows = status && status !== 'all'
      ? db.prepare('SELECT * FROM orders WHERE table_number = ? AND status = ? ORDER BY created_at DESC').all(Number(table), status)
      : db.prepare('SELECT * FROM orders WHERE table_number = ? ORDER BY created_at DESC LIMIT 50').all(Number(table));
  } else {
    rows = status && status !== 'all'
      ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all();
  }
  for (const o of rows) {
    o.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
  }
  res.json(rows);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'preparing', 'done', 'settled', 'cancelled', 'on_hold'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  io.emit('order_updated', order);
  res.json(order);
});

app.patch('/api/orders/:id', (req, res) => {
  const { table_number, waiter_name, order_type, customer_name } = req.body;
  const fields = [], vals = [];
  if (table_number  !== undefined) { fields.push('table_number = ?');  vals.push(Number(table_number)); }
  if (waiter_name   !== undefined) { fields.push('waiter_name = ?');   vals.push(waiter_name); }
  if (order_type    !== undefined) { fields.push('order_type = ?');    vals.push(order_type); }
  if (customer_name !== undefined) { fields.push('customer_name = ?'); vals.push(customer_name); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(req.params.id);
  db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  io.emit('order_updated', order);
  res.json(order);
});

app.patch('/api/orders/:id/discount', (req, res) => {
  const { discount, type } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const subtotal = db.prepare('SELECT SUM(item_price * quantity) as s FROM order_items WHERE order_id = ?').get(req.params.id).s || 0;
  const discountAmt = type === 'percent' ? (subtotal * discount / 100) : Number(discount);
  const tax = (subtotal - discountAmt) * 0.05;
  const newTotal = subtotal - discountAmt + tax;
  db.prepare('UPDATE orders SET discount = ?, total = ? WHERE id = ?').run(discountAmt, newTotal, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  updated.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  io.emit('order_updated', updated);
  res.json(updated);
});

app.patch('/api/orders/:id/tip', (req, res) => {
  const { tip } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  // Remove old tip, add new
  const subtotal = db.prepare('SELECT SUM(item_price * quantity) as s FROM order_items WHERE order_id = ?').get(req.params.id).s || 0;
  const discount = order.discount || 0;
  const tax = (subtotal - discount) * 0.05;
  const newTotal = subtotal - discount + tax + Number(tip);
  db.prepare('UPDATE orders SET tip = ?, total = ? WHERE id = ?').run(Number(tip), newTotal, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  updated.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  io.emit('order_updated', updated);
  res.json(updated);
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

app.patch('/api/admin/items/:id/toggle-special', (req, res) => {
  const item = db.prepare('SELECT is_house_special FROM menu_items WHERE id = ?').get(req.params.id);
  const next = item.is_house_special ? 0 : 1;
  db.prepare('UPDATE menu_items SET is_house_special = ? WHERE id = ?').run(next, req.params.id);
  res.json({ is_house_special: next });
});

// ── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  console.log(`[socket] connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`La Siesta ordering server → http://localhost:${PORT}`));
