const express = require("express");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "2mb" }));


// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME || "vaarahi-sql-db",

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


// =====================================================
// DATABASE CONNECTION
// =====================================================

let poolPromise;

async function getPool() {

    if (!poolPromise) {

        poolPromise = sql
            .connect(dbConfig)
            .then(pool => {

                console.log("====================================");
                console.log("Connected to Azure SQL Database");
                console.log("====================================");

                return pool;
            })
            .catch(error => {

                poolPromise = null;

                console.error(
                    "Database connection failed:",
                    error.message
                );

                throw error;
            });
    }

    return poolPromise;
}


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", async (req, res) => {

    try {

        const pool = await getPool();

        await pool.request().query("SELECT 1 AS Result");

        res.json({
            success: true,
            message: "Sri Vaarahi Pickles API is running",
            database: "Connected"
        });

    } catch (error) {

        console.error("Health check error:", error);

        res.status(500).json({
            success: false,
            message: "API is running but database connection failed"
        });
    }
});


// =====================================================
// GET ALL ACTIVE PRODUCTS
// =====================================================

app.get("/api/products", async (req, res) => {

    try {

        const pool = await getPool();

        const result = await pool
            .request()
            .query(`
                SELECT
                    p.Id,
                    p.CategoryId,
                    p.Name,
                    p.Description,
                    p.Weight,
                    p.Price,
                    p.StockQuantity,
                    p.ImageUrl,
                    c.Name AS CategoryName,
                    c.Description AS CategoryDescription,
                    c.ImageUrl AS CategoryImageUrl

                FROM Products p

                INNER JOIN Categories c
                    ON p.CategoryId = c.Id

                WHERE
                    p.IsActive = 1

                ORDER BY
                    c.Name,
                    p.Name
            `);

        const products = result.recordset.map(row => ({
            id: row.Id,
            categoryId: row.CategoryId,
            name: row.Name,
            description: row.Description,
            weight: row.Weight,
            price: Number(row.Price),
            stockQuantity: row.StockQuantity,
            imageUrl: row.ImageUrl,
            categoryName: row.CategoryName,
            categoryDescription: row.CategoryDescription,
            categoryImageUrl: row.CategoryImageUrl
        }));

        res.json({
            success: true,
            data: products
        });

    } catch (error) {

        console.error("Error fetching products:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
});


// =====================================================
// GET SINGLE PRODUCT
// =====================================================

app.get("/api/products/:id", async (req, res) => {

    try {

        const productId = Number(req.params.id);

        if (!Number.isInteger(productId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("ProductId", sql.Int, productId)
            .query(`
                SELECT
                    p.Id,
                    p.CategoryId,
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

                WHERE
                    p.Id = @ProductId
                    AND p.IsActive = 1
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const row = result.recordset[0];

        res.json({
            success: true,
            data: {
                id: row.Id,
                categoryId: row.CategoryId,
                name: row.Name,
                description: row.Description,
                weight: row.Weight,
                price: Number(row.Price),
                stockQuantity: row.StockQuantity,
                imageUrl: row.ImageUrl,
                categoryName: row.CategoryName
            }
        });

    } catch (error) {

        console.error("Error fetching product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
});


// =====================================================
// SEARCH PRODUCTS
// =====================================================

app.get("/api/products/search", async (req, res) => {

    try {

        const search = String(req.query.q || "").trim();

        if (!search) {

            return res.json({
                success: true,
                data: []
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("Search", sql.NVarChar(150), `%${search}%`)
            .query(`
                SELECT
                    p.Id,
                    p.CategoryId,
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

                WHERE
                    p.IsActive = 1
                    AND
                    (
                        p.Name LIKE @Search
                        OR p.Description LIKE @Search
                        OR c.Name LIKE @Search
                    )

                ORDER BY p.Name
            `);

        const products = result.recordset.map(row => ({
            id: row.Id,
            categoryId: row.CategoryId,
            name: row.Name,
            description: row.Description,
            weight: row.Weight,
            price: Number(row.Price),
            stockQuantity: row.StockQuantity,
            imageUrl: row.ImageUrl,
            categoryName: row.CategoryName
        }));

        res.json({
            success: true,
            data: products
        });

    } catch (error) {

        console.error("Product search error:", error);

        res.status(500).json({
            success: false,
            message: "Product search failed"
        });
    }
});


// =====================================================
// GET CATEGORIES
// =====================================================

app.get("/api/categories", async (req, res) => {

    try {

        const pool = await getPool();

        const result = await pool
            .request()
            .query(`
                SELECT
                    c.Id,
                    c.Name,
                    c.Description,
                    c.ImageUrl,
                    COUNT(p.Id) AS ProductCount

                FROM Categories c

                LEFT JOIN Products p
                    ON c.Id = p.CategoryId
                    AND p.IsActive = 1

                GROUP BY
                    c.Id,
                    c.Name,
                    c.Description,
                    c.ImageUrl

                ORDER BY
                    c.Name
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {

        console.error("Error fetching categories:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories"
        });
    }
});


// =====================================================
// GET PRODUCTS BY CATEGORY
// =====================================================

app.get("/api/categories/:id/products", async (req, res) => {

    try {

        const categoryId = Number(req.params.id);

        if (!Number.isInteger(categoryId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("CategoryId", sql.Int, categoryId)
            .query(`
                SELECT
                    p.Id,
                    p.CategoryId,
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

                WHERE
                    p.CategoryId = @CategoryId
                    AND p.IsActive = 1

                ORDER BY p.Name
            `);

        const products = result.recordset.map(row => ({
            id: row.Id,
            categoryId: row.CategoryId,
            name: row.Name,
            description: row.Description,
            weight: row.Weight,
            price: Number(row.Price),
            stockQuantity: row.StockQuantity,
            imageUrl: row.ImageUrl,
            categoryName: row.CategoryName
        }));

        res.json({
            success: true,
            data: products
        });

    } catch (error) {

        console.error("Category products error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category products"
        });
    }
});


// =====================================================
// PLACE ORDER
// =====================================================

app.post("/api/orders/checkout", async (req, res) => {

    const { customer, items } = req.body;

    // -------------------------------------------------
    // Validate request
    // -------------------------------------------------

    if (!customer) {

        return res.status(400).json({
            success: false,
            message: "Customer details are required"
        });
    }

    if (!Array.isArray(items) || items.length === 0) {

        return res.status(400).json({
            success: false,
            message: "Cart is empty"
        });
    }

    if (!customer.fullName ||
        !customer.phoneNumber ||
        !customer.deliveryAddress ||
        !customer.pincode) {

        return res.status(400).json({
            success: false,
            message: "Please provide all required customer details"
        });
    }


    let transaction;

    try {

        const pool = await getPool();

        transaction = new sql.Transaction(pool);

        await transaction.begin();


        // =================================================
        // STEP 1: INSERT CUSTOMER
        // =================================================

        const customerRequest = new sql.Request(transaction);

        customerRequest.input(
            "FullName",
            sql.NVarChar(100),
            customer.fullName.trim()
        );

        customerRequest.input(
            "Email",
            sql.NVarChar(150),
            customer.email
                ? customer.email.trim()
                : ""
        );

        customerRequest.input(
            "PhoneNumber",
            sql.NVarChar(15),
            customer.phoneNumber.trim()
        );

        customerRequest.input(
            "DeliveryAddress",
            sql.NVarChar(500),
            customer.deliveryAddress.trim()
        );

        customerRequest.input(
            "Pincode",
            sql.NVarChar(10),
            customer.pincode.trim()
        );


        const customerResult =
            await customerRequest.query(`
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
        // STEP 2: VALIDATE PRODUCTS FROM DATABASE
        // =================================================

        let totalAmount = 0;

        const verifiedItems = [];


        for (const item of items) {

            const productId = Number(item.id);
            const quantity = Number(item.quantity);


            if (!Number.isInteger(productId) ||
                !Number.isInteger(quantity) ||
                quantity <= 0) {

                throw new Error(
                    "Invalid product or quantity"
                );
            }


            const productRequest =
                new sql.Request(transaction);

            productRequest.input(
                "ProductId",
                sql.Int,
                productId
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


            if (productResult.recordset.length === 0) {

                throw new Error(
                    `Product ${productId} is not available`
                );
            }


            const product =
                productResult.recordset[0];


            // ---------------------------------------------
            // Check stock
            // ---------------------------------------------

            if (product.StockQuantity < quantity) {

                throw new Error(
                    `${product.Name} has only ${product.StockQuantity} item(s) available`
                );
            }


            // ---------------------------------------------
            // IMPORTANT:
            // Don't trust price from React.
            // Get price from database.
            // ---------------------------------------------

            const unitPrice =
                Number(product.Price);


            const lineTotal =
                unitPrice * quantity;


            totalAmount += lineTotal;


            verifiedItems.push({
                productId: product.Id,
                productName: product.Name,
                quantity,
                unitPrice
            });
        }


        // =================================================
        // STEP 3: INSERT ORDER
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

                OUTPUT
                    INSERTED.Id,
                    INSERTED.OrderDate,
                    INSERTED.TotalAmount,
                    INSERTED.Status

                VALUES
                (
                    @CustomerId,
                    @TotalAmount,
                    'Pending'
                )
            `);


        const order =
            orderResult.recordset[0];


        const orderId = order.Id;


        // =================================================
        // STEP 4: INSERT ORDER ITEMS
        // =================================================

        for (const item of verifiedItems) {

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
            // STEP 5: REDUCE STOCK
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

                SET StockQuantity =
                    StockQuantity - @Quantity

                WHERE
                    Id = @ProductId
                    AND StockQuantity >= @Quantity
            `);
        }


        // =================================================
        // STEP 6: COMMIT
        // =================================================

        await transaction.commit();


        // =================================================
        // SUCCESS RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message: "Order placed successfully!",

            order: {
                id: orderId,
                customerId: customerId,
                orderDate: order.OrderDate,
                totalAmount: Number(order.TotalAmount),
                status: order.Status
            }

        });


    } catch (error) {

        // -----------------------------------------------
        // ROLLBACK
        // -----------------------------------------------

        try {

            if (transaction) {
                await transaction.rollback();
            }

        } catch (rollbackError) {

            console.error(
                "Transaction rollback error:",
                rollbackError
            );
        }


        console.error(
            "Order checkout error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to place order"

        });
    }
});


// =====================================================
// GET ORDER DETAILS
// =====================================================

app.get("/api/orders/:id", async (req, res) => {

    try {

        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const pool = await getPool();


        // -------------------------------------------------
        // Order + Customer
        // -------------------------------------------------

        const orderResult =
            await pool
                .request()
                .input(
                    "OrderId",
                    sql.Int,
                    orderId
                )
                .query(`
                    SELECT

                        o.Id AS OrderId,
                        o.OrderDate,
                        o.TotalAmount,
                        o.Status,

                        c.Id AS CustomerId,
                        c.FullName,
                        c.Email,
                        c.PhoneNumber,
                        c.DeliveryAddress,
                        c.Pincode

                    FROM Orders o

                    INNER JOIN Customers c
                        ON o.CustomerId = c.Id

                    WHERE o.Id = @OrderId
                `);


        if (orderResult.recordset.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Order not found"

            });
        }


        const order =
            orderResult.recordset[0];


        // -------------------------------------------------
        // Order Items
        // -------------------------------------------------

        const itemsResult =
            await pool
                .request()
                .input(
                    "OrderId",
                    sql.Int,
                    orderId
                )
                .query(`
                    SELECT

                        oi.Id,
                        oi.ProductId,
                        p.Name AS ProductName,
                        p.ImageUrl,
                        p.Weight,
                        oi.Quantity,
                        oi.UnitPrice,
                        oi.Quantity * oi.UnitPrice AS LineTotal

                    FROM OrderItems oi

                    INNER JOIN Products p
                        ON oi.ProductId = p.Id

                    WHERE
                        oi.OrderId = @OrderId

                    ORDER BY oi.Id
                `);


        res.json({

            success: true,

            data: {

                order: {
                    id: order.OrderId,
                    orderDate: order.OrderDate,
                    totalAmount: Number(order.TotalAmount),
                    status: order.Status
                },

                customer: {
                    id: order.CustomerId,
                    fullName: order.FullName,
                    email: order.Email,
                    phoneNumber: order.PhoneNumber,
                    deliveryAddress: order.DeliveryAddress,
                    pincode: order.Pincode
                },

                items:
                    itemsResult.recordset.map(item => ({

                        id: item.Id,

                        productId:
                            item.ProductId,

                        productName:
                            item.ProductName,

                        imageUrl:
                            item.ImageUrl,

                        weight:
                            item.Weight,

                        quantity:
                            item.Quantity,

                        unitPrice:
                            Number(item.UnitPrice),

                        lineTotal:
                            Number(item.LineTotal)

                    }))

            }

        });


    } catch (error) {

        console.error(
            "Get order error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch order"

        });
    }
});


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {

    console.error("Unhandled API error:", err);

    res.status(500).json({

        success: false,

        message: "Internal server error"

    });
});


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;


app.listen(PORT, () => {

    console.log("");
    console.log("==========================================");
    console.log("   SRI VAARAHI PICKLES API");
    console.log("==========================================");
    console.log(`   Server running on port ${PORT}`);
    console.log(`   http://localhost:${PORT}`);
    console.log("==========================================");
    console.log("");

});