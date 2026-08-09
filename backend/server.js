const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const dbConfig = {
    user: process.env.DB_USER || 'SVP',
    password: process.env.DB_PASSWORD || 'Vaarahi@#789123',
    server: process.env.DB_SERVER || 'mysqldbserver-789.database.windows.net',
    database: 'vaarahi-sql-db',
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Global pool initialization helper
let poolPromise = sql.connect(dbConfig)
    .then(pool => {
        console.log('Connected to Azure SQL Database successfully!');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

// 1. API Endpoint to fetch active products catalog
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.Id, p.Name, p.Description, p.Weight, p.Price, p.StockQuantity, p.ImageUrl, c.Name AS CategoryName
            FROM Products p
            INNER JOIN Categories c ON p.CategoryId = c.Id
            WHERE p.IsActive = 1
        `);
        
        const products = result.recordset.map(row => ({
            id: row.Id,
            name: row.Name,
            description: row.Description,
            weight: row.Weight,
            price: row.Price,
            stockQuantity: row.StockQuantity,
            imageUrl: row.ImageUrl,
            categoryName: row.CategoryName
        }));

        res.json(products);
    } catch (err) {
        console.error('Database error fetching products:', err);
        res.status(500).send('Server Error');
    }
});

// 2. API Endpoint to fetch categories
app.get('/api/categories', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT Id, Name, Description, ImageUrl FROM Categories`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Database error fetching categories:', err);
        res.status(500).send('Server Error');
    }
});

// 3. API Endpoint to place an order & save customer into Customers table
app.post('/api/orders/checkout', async (req, res) => {
    const { customer, items } = req.body; 

    if (!customer || !items || items.length === 0) {
        return res.status(400).json({ error: 'Invalid order payload' });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Step A: Insert Customer matching your exact [dbo].[Customers] table schema
        const customerRequest = new sql.Request(transaction);
        customerRequest.input('FullName', sql.NVarChar, customer.fullName);
        customerRequest.input('Email', sql.NVarChar, customer.email);
        customerRequest.input('PhoneNumber', sql.NVarChar, customer.phoneNumber);
        customerRequest.input('DeliveryAddress', sql.NVarChar, customer.deliveryAddress);
        customerRequest.input('Pincode', sql.NVarChar, customer.pincode);

        const customerResult = await customerRequest.query(`
            INSERT INTO [dbo].[Customers] (FullName, Email, PhoneNumber, DeliveryAddress, Pincode)
            OUTPUT INSERTED.Id
            VALUES (@FullName, @Email, @PhoneNumber, @DeliveryAddress, @Pincode)
        `);
        const customerId = customerResult.recordset[0].Id;

        // Step B: Calculate Total Amount (using 'price' sent from React cart items)
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Step C: Insert Order
        const orderRequest = new sql.Request(transaction);
        orderRequest.input('CustomerId', sql.Int, customerId);
        orderRequest.input('TotalAmount', sql.Decimal(18, 2), totalAmount);

        const orderResult = await orderRequest.query(`
            INSERT INTO Orders (CustomerId, TotalAmount, Status)
            OUTPUT INSERTED.Id
            VALUES (@CustomerId, @TotalAmount, 'Pending')
        `);
        const orderId = orderResult.recordset[0].Id;

        // Step D: Insert Order Items
        for (let item of items) {
            const itemRequest = new sql.Request(transaction);
            itemRequest.input('OrderId', sql.Int, orderId);
            itemRequest.input('ProductId', sql.Int, item.id); // Matches item.id from frontend
            itemRequest.input('Quantity', sql.Int, item.quantity);
            itemRequest.input('UnitPrice', sql.Decimal(18, 2), item.price); // Maps item.price to UnitPrice

            await itemRequest.query(`
                INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice)
                VALUES (@OrderId, @ProductId, @Quantity, @UnitPrice)
            `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Order placed successfully!', orderId, customerId });
    } catch (err) {
        console.error('Order transaction error:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`SRI VAARAHI PICKELS API running on port ${PORT}`);
});