const express = require("express");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    cors({
        origin: "*"
    })
);


// =====================================================
// DATABASE CONFIGURATION
// LOCAL SQL SERVER
// =====================================================

const dbConfig = {
    user: process.env.DB_USER || "sa",

    password:
        process.env.DB_PASSWORD || "Manikanta@123",

    server:
        process.env.DB_SERVER || "DESKTOP-SN90TT1",

    database:
        process.env.DB_NAME || "VAARAHI",

    options: {

        // Local SQL Server
        encrypt: true,

        // Required because local SQL Server
        // is using a self-signed certificate
        trustServerCertificate: true

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

let poolPromise = sql
    .connect(dbConfig)
    .then((pool) => {

        console.log("");
        console.log(
            "Connected to LOCAL SQL Server successfully!"
        );

        console.log(
            `Server  : ${dbConfig.server}`
        );

        console.log(
            `Database: ${dbConfig.database}`
        );

        console.log("");

        return pool;

    })
    .catch((err) => {

        console.error("");
        console.error(
            "=========================================="
        );

        console.error(
            "DATABASE CONNECTION FAILED"
        );

        console.error(
            "=========================================="
        );

        console.error(err.message);

        console.error(
            "=========================================="
        );

        console.error("");

        throw err;

    });


// =====================================================
// ROOT API
// =====================================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "SRI VAARAHI PICKELS API is running",

        database:
            dbConfig.database,

        server:
            dbConfig.server

    });

});


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", async (req, res) => {

    try {

        const pool = await poolPromise;

        await pool
            .request()
            .query("SELECT 1 AS Result");


        res.status(200).json({

            success: true,

            message:
                "API and database are working",

            server:
                dbConfig.server,

            database:
                dbConfig.database

        });

    }
    catch (err) {

        console.error(
            "Health check database error:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Database connection failed",

            error:
                err.message

        });

    }

});


// =====================================================
// GET PRODUCTS
// =====================================================

app.get("/api/products", async (req, res) => {

    try {

        const pool =
            await poolPromise;


        const result =
            await pool
                .request()
                .query(`

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


        const products =
            result.recordset.map((row) => ({

                id: row.Id,

                name: row.Name,

                description:
                    row.Description,

                weight:
                    row.Weight,

                price:
                    Number(row.Price),

                stockQuantity:
                    Number(row.StockQuantity),

                imageUrl:
                    row.ImageUrl,

                categoryName:
                    row.CategoryName

            }));


        res.status(200).json(products);

    }
    catch (err) {

        console.error(
            "Database error fetching products:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch products",

            error:
                err.message

        });

    }

});


// =====================================================
// GET CATEGORIES
// =====================================================

app.get("/api/categories", async (req, res) => {

    try {

        const pool =
            await poolPromise;


        const result =
            await pool
                .request()
                .query(`

                    SELECT
                        Id,
                        Name,
                        Description,
                        ImageUrl

                    FROM Categories

                    ORDER BY Id

                `);


        res.status(200).json(
            result.recordset
        );

    }
    catch (err) {

        console.error(
            "Database error fetching categories:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch categories",

            error:
                err.message

        });

    }

});


// =====================================================
// PLACE ORDER
// =====================================================

app.post(
    "/api/orders/checkout",
    async (req, res) => {

        const {
            customer,
            items
        } = req.body;


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !customer ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Invalid order payload"

            });

        }


        let transaction;


        try {

            const pool =
                await poolPromise;


            transaction =
                new sql.Transaction(pool);


            await transaction.begin();


            // =========================================
            // CUSTOMER
            // =========================================

            const customerRequest =
                new sql.Request(transaction);


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
                customerResult
                    .recordset[0]
                    .Id;


            // =========================================
            // CALCULATE TOTAL
            // =========================================

            let totalAmount = 0;


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


                // -------------------------------------
                // STOCK CHECK
                // -------------------------------------

                if (
                    quantity >
                    Number(product.StockQuantity)
                ) {

                    throw new Error(
                        `${product.Name} has only ${product.StockQuantity} items available`
                    );

                }


                // -------------------------------------
                // ALWAYS USE DATABASE PRICE
                // -------------------------------------

                totalAmount +=
                    Number(product.Price) *
                    quantity;

            }


            // =========================================
            // INSERT ORDER
            // =========================================

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
                orderResult
                    .recordset[0]
                    .Id;


            // =========================================
            // INSERT ORDER ITEMS
            // =========================================

            for (const item of items) {

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
                            Price,
                            StockQuantity

                        FROM Products

                        WHERE Id = @ProductId

                    `);


                const product =
                    productResult
                        .recordset[0];


                const quantity =
                    Number(item.quantity);


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
                    Number(item.id)
                );


                itemRequest.input(
                    "Quantity",
                    sql.Int,
                    quantity
                );


                itemRequest.input(
                    "UnitPrice",
                    sql.Decimal(18, 2),
                    Number(product.Price)
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


                // =====================================
                // UPDATE STOCK
                // =====================================

                const stockRequest =
                    new sql.Request(transaction);


                stockRequest.input(
                    "ProductId",
                    sql.Int,
                    Number(item.id)
                );


                stockRequest.input(
                    "Quantity",
                    sql.Int,
                    quantity
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


            // =========================================
            // COMMIT
            // =========================================

            await transaction.commit();


            res.status(201).json({

                success: true,

                message:
                    "Order placed successfully!",

                orderId:
                    orderId,

                customerId:
                    customerId,

                totalAmount:
                    totalAmount

            });

        }
        catch (err) {

            console.error(
                "Order transaction error:",
                err
            );


            // -----------------------------------------
            // ROLLBACK
            // -----------------------------------------

            try {

                if (
                    transaction &&
                    transaction._aborted !== true
                ) {

                    await transaction.rollback();

                }

            }
            catch (rollbackError) {

                console.error(
                    "Transaction rollback error:",
                    rollbackError
                );

            }


            res.status(500).json({

                success: false,

                error:
                    "Failed to place order",

                message:
                    err.message

            });

        }

    }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "=========================================="
        );

        console.log(
            "        SRI VAARAHI PICKELS API"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Server running on port ${PORT}`
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
            `Database: ${dbConfig.database}`
        );

        console.log(
            "=========================================="
        );

    }
);