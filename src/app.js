// src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API de BarberSite funcionando correctamente 💈');
});

// --- MÓDULOS DE SEGURIDAD Y ACCESO ---
app.use('/api/auth', require('./features/auth/auth.routes'));
app.use('/api/users', require('./features/users/user.routes'));
app.use('/api/roles', require('./features/roles/role.routes'));

// --- CRUD TABLAS MAESTRAS ---
app.use('/api/clients', require('./features/clients/client.routes'));
app.use('/api/products', require('./features/products/product.routes'));
app.use('/api/services', require('./features/services/service.routes'));
app.use('/api/suppliers', require('./features/suppliers/supplier.routes'));

// --- MÓDULOS TRANSACCIONALES Y DE NEGOCIO ---
app.use('/api/purchases', require('./features/purchases/purchase.routes'));
app.use('/api/stock-returns', require('./features/stock-returns/stock-return.routes'));
app.use('/api/landing-config', require('./features/landing-config/landing.routes'));

// --- MÓDULOS EN CONSTRUCCIÓN (Esqueletos para la próxima entrega) ---
app.use('/api/appointments', require('./features/appointments/appointment.routes'));
app.use('/api/sales', require('./features/sales/sale.routes'));
app.use('/api/supplier-returns', require('./features/supplier-returns/supp-return.routes'));

module.exports = app;