require("dotenv").config();

const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const createAdminRouter = require("./adminRoutes");

const app = express();

app.use(express.json({ limit: "2mb" }));

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false 
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

// =====================================================
// DATABASE CONNECTION
// =====================================================

let poolPromise = null;

async function getDbPool() {
    if (poolPromise) {
        return poolPromise;
    }

    poolPromise = sql
        .connect(dbConfig)
        .then((pool) => {
            console.log("==========================================");
            console.log("Database connected successfully!");
            console.log(`Server   : ${dbConfig.server}`);
            console.log(`Database : ${dbConfig.database}`);
            console.log("==========================================");
            return pool;
        })
        .catch((err) => {
            console.error("==========================================");
            console.error("DATABASE CONNECTION FAILED");
            console.error(err.message);
            console.error("==========================================");

            poolPromise = null;

            throw err;
        });

    return poolPromise;
}

// =====================================================
// ROOT API
// =====================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SRI VAARAHI PICKELS API is running",
        database: dbConfig.database,
        server: dbConfig.server,
        environment: process.env.NODE_ENV || "development"
    });
});

// =====================================================
// HEALTH CHECK
// IMPORTANT:
// This endpoint does NOT require the database.
// Render can therefore keep the service alive even
// when the database is temporarily unavailable.
// =====================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SRI VAARAHI PICKELS API is running",
        databaseConfigured: !!dbConfig.database
    });
});

// =====================================================
// DATABASE HEALTH CHECK
// =====================================================

app.get("/api/health/db", async (req, res) => {
    try {
        const pool = await getDbPool();

        await pool.request().query("SELECT 1 AS Result");

        res.status(200).json({
            success: true,
            message: "API and database are working",
            server: dbConfig.server,
            database: dbConfig.database
        });
    } catch (err) {
        console.error("Database health check error:");
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: err.message
        });
    }
});

// =====================================================
// GET PRODUCTS
// =====================================================

app.get("/api/products", async (req, res) => {
    try {
        const pool = await getDbPool();

        const result = await pool.request().query(`
            SELECT
                p.Id,
                p.Name,
                p.Description,
                p.Weight,
                p.Price,
                p.StockQuantity,
                p.ImageUrl,
                c.Name AS CategoryName
            FROM Products p
            INNER JOIN Categories c
                ON p.CategoryId = c.Id
            WHERE p.IsActive = 1
            ORDER BY p.Id
        `);

        const products = result.recordset.map((row) => ({
            id: row.Id,
            name: row.Name,
            description: row.Description,
            weight: row.Weight,
            price: Number(row.Price),
            stockQuantity: Number(row.StockQuantity),
            imageUrl: row.ImageUrl,
            categoryName: row.CategoryName
        }));

        res.status(200).json(products);
    } catch (err) {
        console.error("Database error fetching products:");
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: err.message
        });
    }
});

// =====================================================
// GET CATEGORIES
// =====================================================

app.get("/api/categories", async (req, res) => {
    try {
        const pool = await getDbPool();

        const result = await pool.request().query(`
            SELECT
                Id,
                Name,
                Description,
                ImageUrl
            FROM Categories
            ORDER BY Id
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Database error fetching categories:");
        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: err.message
        });
    }
});

// =====================================================
// PLACE ORDER
// =====================================================

app.post("/api/orders/checkout", async (req, res) => {
    const { customer, items } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
        !customer ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return res.status(400).json({
            success: false,
            error: "Invalid order payload"
        });
    }

    if (!customer.fullName) {
        return res.status(400).json({
            success: false,
            error: "Full name is required"
        });
    }

    if (!customer.phoneNumber) {
        return res.status(400).json({
            success: false,
            error: "Phone number is required"
        });
    }

    if (!customer.deliveryAddress) {
        return res.status(400).json({
            success: false,
            error: "Delivery address is required"
        });
    }

    if (!customer.pincode) {
        return res.status(400).json({
            success: false,
            error: "Pincode is required"
        });
    }

    let transaction = null;

    try {
        const pool = await getDbPool();

        transaction = new sql.Transaction(pool);

        await transaction.begin();

        // =================================================
        // CUSTOMER
        // =================================================

        const customerRequest = new sql.Request(transaction);

        customerRequest.input(
            "FullName",
            sql.NVarChar(100),
            customer.fullName
        );

        customerRequest.input(
            "Email",
            sql.NVarChar(150),
            customer.email || ""
        );

        customerRequest.input(
            "PhoneNumber",
            sql.NVarChar(15),
            customer.phoneNumber
        );

        customerRequest.input(
            "DeliveryAddress",
            sql.NVarChar(500),
            customer.deliveryAddress
        );

        customerRequest.input(
            "Pincode",
            sql.NVarChar(10),
            customer.pincode
        );

        const customerResult = await customerRequest.query(`
            INSERT INTO Customers
            (
                FullName,
                Email,
                PhoneNumber,
                DeliveryAddress,
                Pincode
            )
            OUTPUT INSERTED.Id
            VALUES
            (
                @FullName,
                @Email,
                @PhoneNumber,
                @DeliveryAddress,
                @Pincode
            )
        `);

        const customerId =
            customerResult.recordset[0].Id;

        // =================================================
        // CALCULATE TOTAL
        // IMPORTANT:
        // Price is always taken from database.
        // Never trust frontend price.
        // =================================================

        let totalAmount = 0;

        const validatedItems = [];

        for (const item of items) {
            if (
                !item.id ||
                !item.quantity ||
                Number(item.quantity) <= 0
            ) {
                throw new Error(
                    "Invalid product or quantity"
                );
            }

            const productRequest =
                new sql.Request(transaction);

            productRequest.input(
                "ProductId",
                sql.Int,
                Number(item.id)
            );

            const productResult =
                await productRequest.query(`
                    SELECT
                        Id,
                        Name,
                        Price,
                        StockQuantity
                    FROM Products
                    WHERE
                        Id = @ProductId
                        AND IsActive = 1
                `);

            if (
                productResult.recordset.length === 0
            ) {
                throw new Error(
                    `Product ${item.id} not found`
                );
            }

            const product =
                productResult.recordset[0];

            const quantity =
                Number(item.quantity);

            // =================================================
            // STOCK CHECK
            // =================================================

            if (
                quantity >
                Number(product.StockQuantity)
            ) {
                throw new Error(
                    `${product.Name} has only ${product.StockQuantity} items available`
                );
            }

            // =================================================
            // DATABASE PRICE
            // =================================================

            const unitPrice =
                Number(product.Price);

            totalAmount +=
                unitPrice * quantity;

            validatedItems.push({
                productId: Number(item.id),
                quantity: quantity,
                unitPrice: unitPrice
            });
        }

        // =================================================
        // INSERT ORDER
        // =================================================

        const orderRequest =
            new sql.Request(transaction);

        orderRequest.input(
            "CustomerId",
            sql.Int,
            customerId
        );

        orderRequest.input(
            "TotalAmount",
            sql.Decimal(18, 2),
            totalAmount
        );

        const orderResult =
            await orderRequest.query(`
                INSERT INTO Orders
                (
                    CustomerId,
                    TotalAmount,
                    Status
                )
                OUTPUT INSERTED.Id
                VALUES
                (
                    @CustomerId,
                    @TotalAmount,
                    'Pending'
                )
            `);

        const orderId =
            orderResult.recordset[0].Id;

        // =================================================
        // INSERT ORDER ITEMS + UPDATE STOCK
        // =================================================

        for (const item of validatedItems) {
            const itemRequest =
                new sql.Request(transaction);

            itemRequest.input(
                "OrderId",
                sql.Int,
                orderId
            );

            itemRequest.input(
                "ProductId",
                sql.Int,
                item.productId
            );

            itemRequest.input(
                "Quantity",
                sql.Int,
                item.quantity
            );

            itemRequest.input(
                "UnitPrice",
                sql.Decimal(18, 2),
                item.unitPrice
            );

            await itemRequest.query(`
                INSERT INTO OrderItems
                (
                    OrderId,
                    ProductId,
                    Quantity,
                    UnitPrice
                )
                VALUES
                (
                    @OrderId,
                    @ProductId,
                    @Quantity,
                    @UnitPrice
                )
            `);

            // =================================================
            // UPDATE STOCK
            // =================================================

            const stockRequest =
                new sql.Request(transaction);

            stockRequest.input(
                "ProductId",
                sql.Int,
                item.productId
            );

            stockRequest.input(
                "Quantity",
                sql.Int,
                item.quantity
            );

            await stockRequest.query(`
                UPDATE Products
                SET
                    StockQuantity =
                    StockQuantity - @Quantity
                WHERE
                    Id = @ProductId
            `);
        }

        // =================================================
        // COMMIT
        // =================================================

        await transaction.commit();

        console.log(
            `Order ${orderId} placed successfully`
        );

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            orderId: orderId,
            customerId: customerId,
            totalAmount: totalAmount
        });
    } catch (err) {
        console.error(
            "Order transaction error:"
        );

        console.error(err);

        // =================================================
        // ROLLBACK
        // =================================================

        if (transaction) {
            try {
                if (
                    transaction._aborted !== true
                ) {
                    await transaction.rollback();
                }
            } catch (rollbackError) {
                console.error(
                    "Transaction rollback error:"
                );

                console.error(
                    rollbackError
                );
            }
        }

        res.status(500).json({
            success: false,
            error: "Failed to place order",
            message: err.message
        });
    }
});


// =====================================================
// PUBLIC BANNERS
// =====================================================
app.get("/api/banners", async (req, res) => {
    try {
        const pool = await getDbPool();
        const result = await pool.request().query(`
            SELECT Id,Title,Subtitle,ImageUrl,MobileImageUrl,ButtonText,ButtonLink,DisplayOrder
            FROM Banners
            WHERE IsActive=1
              AND (StartDate IS NULL OR StartDate <= GETUTCDATE())
              AND (EndDate IS NULL OR EndDate >= GETUTCDATE())
            ORDER BY DisplayOrder,Id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({success:false,message:"Failed to fetch banners"});
    }
});

// =====================================================
// ADMIN API
// =====================================================
app.use("/api/admin", createAdminRouter(getDbPool));

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.originalUrl
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("Unhandled server error:");
    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: err.message
    });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "=========================================="
        );

        console.log(
            "        SRI VAARAHI PICKLES API"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `Environment: ${process.env.NODE_ENV || "development"}`
        );

        console.log(
            `Database: ${dbConfig.database}`
        );

        console.log(
            `Database Server: ${dbConfig.server}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            `http://localhost:${PORT}/api/health`
        );

        console.log(
            `http://localhost:${PORT}/api/products`
        );

        console.log(
            `http://localhost:${PORT}/api/categories`
        );

        console.log(
            `http://localhost:${PORT}/api/health/db`
        );

        console.log(
            "=========================================="
        );
    }
);