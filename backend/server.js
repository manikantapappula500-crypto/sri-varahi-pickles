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
    }
};

// 1. API Endpoint to fetch active products catalog
app.get('/api/products', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`
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
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT Id, Name, Description, ImageUrl FROM Categories`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Database error fetching categories:', err);
        res.status(500).send('Server Error');
    }
});

// 3. API Endpoint to place an order
app.post('/api/orders', async (req, res) => {
    const { customer, items } = req.body; 
    // customer: { fullName, email, phoneNumber, deliveryAddress, pincode }
    // items: [{ productId, quantity, unitPrice }]

    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Step A: Insert Customer
        const customerRequest = new sql.Request(transaction);
        customerRequest.input('FullName', sql.NVarChar, customer.fullName);
        customerRequest.input('Email', sql.NVarChar, customer.email);
        customerRequest.input('PhoneNumber', sql.NVarChar, customer.phoneNumber);
        customerRequest.input('DeliveryAddress', sql.NVarChar, customer.deliveryAddress);
        customerRequest.input('Pincode', sql.NVarChar, customer.pincode);

        const customerResult = await customerRequest.query(`
            INSERT INTO Customers (FullName, Email, PhoneNumber, DeliveryAddress, Pincode)
            OUTPUT INSERTED.Id
            VALUES (@FullName, @Email, @PhoneNumber, @DeliveryAddress, @Pincode)
        `);
        const customerId = customerResult.recordset[0].Id;

        // Step B: Calculate Total Amount
        const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

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
            itemRequest.input('ProductId', sql.Int, item.productId);
            itemRequest.input('Quantity', sql.Int, item.quantity);
            itemRequest.input('UnitPrice', sql.Decimal(18, 2), item.unitPrice);

            await itemRequest.query(`
                INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice)
                VALUES (@OrderId, @ProductId, @Quantity, @UnitPrice)
            `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Order placed successfully!', orderId });
    } catch (err) {
        await transaction.rollback();
        console.error('Order transaction error:', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`SRI VAARAHI PICKELS API running on port ${PORT}`);
});