import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

const medicines = [
  {
    id: 1,
    name: 'Panadol Extra',
    category: 'Pain Relief',
    batch: 'PAN-101',
    stock: 45,
    purchasePrice: 28,
    sellingPrice: 54,
  },
  {
    id: 2,
    name: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    batch: 'AMO-204',
    stock: 22,
    purchasePrice: 84,
    sellingPrice: 170,
  },
  {
    id: 3,
    name: 'Cough Syrup',
    category: 'Respiratory',
    batch: 'COU-118',
    stock: 8,
    purchasePrice: 120,
    sellingPrice: 260,
  },
];

const customers = [
  { id: 1, name: 'Ali Khan', phone: '0300-1234567', type: 'Retail', creditLimit: 15000, balance: 0 },
  { id: 2, name: 'City Pharmacy', phone: '021-9876543', type: 'Wholesale', creditLimit: 50000, balance: 0 },
  { id: 3, name: 'Agha Clinic', phone: '0321-1122334', type: 'Institution', creditLimit: 70000, balance: 0 },
];

let sales = [
  { id: 1, medicineId: 1, medicineName: 'Panadol Extra', customerId: 1, customerName: 'Ali Khan', quantity: 5, total: 270, gst: 45, createdAt: '2026-09-27T09:00:00Z' },
  { id: 2, medicineId: 2, medicineName: 'Amoxicillin 500mg', customerId: 2, customerName: 'City Pharmacy', quantity: 10, total: 1700, gst: 289, createdAt: '2026-09-27T12:15:00Z' },
];

let ledger = [
  { id: 1, type: 'sale', description: 'Sale to Ali Khan', amount: 270, createdAt: '2026-09-27T09:00:00Z' },
  { id: 2, type: 'sale', description: 'Sale to City Pharmacy', amount: 1700, createdAt: '2026-09-27T12:15:00Z' },
  { id: 3, type: 'purchase', description: 'Inventory restock', amount: -3600, createdAt: '2026-09-20T14:10:00Z' },
];

function calculateOverview() {
  const totalInventoryValue = medicines.reduce((sum, item) => sum + item.stock * item.purchasePrice, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const customerCount = customers.length;
  const gstDue = sales.reduce((sum, sale) => sum + sale.gst, 0);
  const lowStockItems = medicines.filter((item) => item.stock <= 10).length;

  return {
    totalInventoryValue,
    totalSales,
    customerCount,
    gstDue,
    lowStockItems,
  };
}

function calculateFbrSummary() {
  const currentMonthSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const currentMonthGst = sales.reduce((sum, sale) => sum + sale.gst, 0);

  return [
    {
      period: 'Current Month',
      taxableSales: currentMonthSales,
      gst: currentMonthGst,
      status: currentMonthGst > 0 ? 'Compliant' : 'Pending',
    },
    {
      period: 'Quarterly',
      taxableSales: currentMonthSales * 3,
      gst: currentMonthGst * 3,
      status: 'Ready',
    },
  ];
}

app.get('/api/overview', (req, res) => {
  res.json(calculateOverview());
});

app.get('/api/medicines', (req, res) => {
  res.json(medicines);
});

app.post('/api/medicines', (req, res) => {
  const { name, category, batch, stock, purchasePrice, sellingPrice } = req.body;

  if (!name || !category || !batch || Number(stock) < 0) {
    return res.status(400).json({ error: 'Medicine details are incomplete.' });
  }

  const nextId = medicines.length ? medicines[medicines.length - 1].id + 1 : 1;
  const medicine = {
    id: nextId,
    name,
    category,
    batch,
    stock: Number(stock),
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
  };

  medicines.push(medicine);
  ledger.push({
    id: ledger.length ? ledger[ledger.length - 1].id + 1 : 1,
    type: 'purchase',
    description: `Added ${name} inventory`,
    amount: Number(stock) * Number(purchasePrice),
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json(medicine);
});

app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, type, creditLimit } = req.body;

  if (!name || !phone || !type) {
    return res.status(400).json({ error: 'Customer details are incomplete.' });
  }

  const nextId = customers.length ? customers[customers.length - 1].id + 1 : 1;
  const customer = {
    id: nextId,
    name,
    phone,
    type,
    creditLimit: Number(creditLimit) || 0,
    balance: 0,
  };

  customers.push(customer);
  return res.status(201).json(customer);
});

app.get('/api/sales', (req, res) => {
  res.json(sales);
});

app.post('/api/sales', (req, res) => {
  const { customerId, medicineId, quantity } = req.body;

  if (!customerId || !medicineId || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Sale details are incomplete.' });
  }

  const customer = customers.find((entry) => entry.id === Number(customerId));
  const medicine = medicines.find((entry) => entry.id === Number(medicineId));

  if (!customer || !medicine) {
    return res.status(404).json({ error: 'Customer or medicine not found.' });
  }

  const finalQuantity = Number(quantity);

  if (finalQuantity > medicine.stock) {
    return res.status(400).json({ error: 'Insufficient stock for this sale.' });
  }

  medicine.stock -= finalQuantity;

  const subtotal = medicine.sellingPrice * finalQuantity;
  const gst = subtotal * 0.17;
  const total = subtotal + gst;

  const sale = {
    id: sales.length ? sales[sales.length - 1].id + 1 : 1,
    medicineId: medicine.id,
    medicineName: medicine.name,
    customerId: customer.id,
    customerName: customer.name,
    quantity: finalQuantity,
    total,
    gst,
    createdAt: new Date().toISOString(),
  };

  sales.unshift(sale);

  customer.balance = (customer.balance || 0) + total;

  ledger.unshift({
    id: ledger.length ? ledger[0].id + 1 : 1,
    type: 'sale',
    description: `Sale - ${medicine.name}`,
    amount: total,
    createdAt: sale.createdAt,
  });

  return res.status(201).json(sale);
});

app.get('/api/ledger', (req, res) => {
  res.json(ledger);
});

app.get('/api/fbr', (req, res) => {
  res.json(calculateFbrSummary());
});

app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`PharmaCare PK server running on http://localhost:${PORT}`);
});
