const express=require("express");
const sql=require("mssql");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");

function createAdminRouter(getDbPool){
const router=express.Router();
const secret=process.env.ADMIN_JWT_SECRET;

if(!secret){
console.warn("WARNING: ADMIN_JWT_SECRET is not set.");
}

function auth(req,res,next){
const header=req.headers.authorization||"";
const token=header.startsWith("Bearer ")?header.slice(7):null;
if(!token||!secret){
return res.status(401).json({success:false,message:"Unauthorized"});
}
try{
req.admin=jwt.verify(token,secret);
next();
}catch(error){
return res.status(401).json({
success:false,
message:"Invalid or expired admin session"
});
}
}

router.post("/login",async(req,res)=>{
try{
const username=String(req.body?.username||"").trim();
const password=String(req.body?.password||"");

if(!username||!password){
return res.status(400).json({
success:false,
message:"Username and password are required"
});
}

const pool=await getDbPool();

const result=await pool.request()
.input("Username",sql.NVarChar(100),username)
.query(`
SELECT TOP 1
Id,
Username,
PasswordHash,
FullName,
RoleName,
IsActive
FROM AdminUsers
WHERE Username=@Username
`);

if(result.recordset.length===0){
return res.status(401).json({
success:false,
message:"Invalid login"
});
}

const admin=result.recordset[0];

if(!admin.IsActive){
return res.status(401).json({
success:false,
message:"Admin account is inactive"
});
}

if(!admin.PasswordHash){
return res.status(401).json({
success:false,
message:"Admin password is not configured"
});
}

const passwordValid=await bcrypt.compare(
password,
admin.PasswordHash
);

if(!passwordValid){
return res.status(401).json({
success:false,
message:"Invalid login"
});
}

if(!secret){
return res.status(500).json({
success:false,
message:"Admin authentication is not configured"
});
}

const token=jwt.sign(
{
id:admin.Id,
username:admin.Username,
role:admin.RoleName
},
secret,
{
expiresIn:"8h"
}
);

return res.status(200).json({
success:true,
token,
admin:{
id:admin.Id,
username:admin.Username,
fullName:admin.FullName,
role:admin.RoleName
}
});

}catch(error){
console.error("Admin login error:",error);
return res.status(500).json({
success:false,
message:"Login failed"
});
}
});

router.get("/me",auth,(req,res)=>{
return res.json({
success:true,
admin:req.admin
});
});

router.get("/dashboard",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const [
orders,
products,
customers,
sales,
lowStock
]=await Promise.all([
pool.request().query(`
SELECT COUNT(*) AS Total
FROM Orders
`),
pool.request().query(`
SELECT COUNT(*) AS Total
FROM Products
WHERE IsActive=1
`),
pool.request().query(`
SELECT COUNT(*) AS Total
FROM Customers
`),
pool.request().query(`
SELECT ISNULL(SUM(TotalAmount),0) AS Total
FROM Orders
WHERE CAST(OrderDate AS date)=CAST(GETUTCDATE() AS date)
AND Status<>'Cancelled'
`),
pool.request().query(`
SELECT TOP 10
Id,
Name,
Weight,
StockQuantity,
Price
FROM Products
WHERE IsActive=1
AND StockQuantity<=10
ORDER BY StockQuantity,Name
`)
]);

return res.json({
success:true,
stats:{
orders:Number(orders.recordset[0].Total||0),
products:Number(products.recordset[0].Total||0),
customers:Number(customers.recordset[0].Total||0),
todaySales:Number(sales.recordset[0].Total||0)
},
lowStock:lowStock.recordset
});

}catch(error){
console.error("Admin dashboard error:",error);
return res.status(500).json({
success:false,
message:"Dashboard failed"
});
}
});

router.get("/products",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const result=await pool.request().query(`
SELECT
p.Id,
p.CategoryId,
p.Name,
p.Description,
p.Weight,
p.Price,
p.StockQuantity,
p.ImageUrl,
p.IsActive,
c.Name AS CategoryName
FROM Products p
LEFT JOIN Categories c
ON c.Id=p.CategoryId
ORDER BY p.Id DESC
`);

return res.json({
success:true,
data:result.recordset
});

}catch(error){
console.error("Admin products error:",error);
return res.status(500).json({
success:false,
message:"Failed to load products"
});
}
});

router.post("/products",auth,async(req,res)=>{
try{
const x=req.body||{};

if(!x.Name){
return res.status(400).json({
success:false,
message:"Product name is required"
});
}

const pool=await getDbPool();

const result=await pool.request()
.input("CategoryId",sql.Int,Number(x.CategoryId))
.input("Name",sql.NVarChar(150),String(x.Name))
.input("Description",sql.NVarChar(sql.MAX),x.Description||null)
.input("Weight",sql.NVarChar(50),x.Weight||null)
.input("Price",sql.Decimal(18,2),Number(x.Price||0))
.input("StockQuantity",sql.Int,Number(x.StockQuantity||0))
.input("ImageUrl",sql.NVarChar(sql.MAX),x.ImageUrl||null)
.input("IsActive",sql.Bit,x.IsActive!==false)
.query(`
INSERT INTO Products
(
CategoryId,
Name,
Description,
Weight,
Price,
StockQuantity,
ImageUrl,
IsActive
)
OUTPUT INSERTED.*
VALUES
(
@CategoryId,
@Name,
@Description,
@Weight,
@Price,
@StockQuantity,
@ImageUrl,
@IsActive
)
`);

return res.status(201).json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Create product error:",error);
return res.status(500).json({
success:false,
message:"Failed to create product",
error:error.message
});
}
});

router.put("/products/:id",auth,async(req,res)=>{
try{
const id=Number(req.params.id);

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid product ID"
});
}

const x=req.body||{};
const pool=await getDbPool();

const result=await pool.request()
.input("Id",sql.Int,id)
.input("CategoryId",sql.Int,Number(x.CategoryId))
.input("Name",sql.NVarChar(150),String(x.Name))
.input("Description",sql.NVarChar(sql.MAX),x.Description||null)
.input("Weight",sql.NVarChar(50),x.Weight||null)
.input("Price",sql.Decimal(18,2),Number(x.Price||0))
.input("StockQuantity",sql.Int,Number(x.StockQuantity||0))
.input("ImageUrl",sql.NVarChar(sql.MAX),x.ImageUrl||null)
.input("IsActive",sql.Bit,x.IsActive!==false)
.query(`
UPDATE Products
SET
CategoryId=@CategoryId,
Name=@Name,
Description=@Description,
Weight=@Weight,
Price=@Price,
StockQuantity=@StockQuantity,
ImageUrl=@ImageUrl,
IsActive=@IsActive
WHERE Id=@Id;

SELECT
p.*,
c.Name AS CategoryName
FROM Products p
LEFT JOIN Categories c
ON c.Id=p.CategoryId
WHERE p.Id=@Id
`);

return res.json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Update product error:",error);
return res.status(500).json({
success:false,
message:"Failed to update product",
error:error.message
});
}
});

router.delete("/products/:id",auth,async(req,res)=>{
try{
const id=Number(req.params.id);

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid product ID"
});
}

const pool=await getDbPool();

await pool.request()
.input("Id",sql.Int,id)
.query(`
UPDATE Products
SET IsActive=0
WHERE Id=@Id
`);

return res.json({
success:true,
message:"Product disabled"
});

}catch(error){
console.error("Disable product error:",error);
return res.status(500).json({
success:false,
message:"Failed to disable product"
});
}
});

router.get("/categories",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const result=await pool.request().query(`
SELECT
Id,
Name,
Description,
ImageUrl
FROM Categories
ORDER BY Id
`);

return res.json({
success:true,
data:result.recordset
});

}catch(error){
console.error("Admin categories error:",error);
return res.status(500).json({
success:false,
message:"Failed to load categories"
});
}
});

router.post("/categories",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const result=await pool.request()
.input("Name",sql.NVarChar(100),req.body?.Name)
.input("Description",sql.NVarChar(255),req.body?.Description||null)
.input("ImageUrl",sql.NVarChar(sql.MAX),req.body?.ImageUrl||null)
.query(`
INSERT INTO Categories
(
Name,
Description,
ImageUrl
)
OUTPUT INSERTED.*
VALUES
(
@Name,
@Description,
@ImageUrl
)
`);

return res.status(201).json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Create category error:",error);
return res.status(500).json({
success:false,
message:"Failed to create category"
});
}
});

router.put("/categories/:id",auth,async(req,res)=>{
try{
const id=Number(req.params.id);

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid category ID"
});
}

const pool=await getDbPool();

const result=await pool.request()
.input("Id",sql.Int,id)
.input("Name",sql.NVarChar(100),req.body?.Name)
.input("Description",sql.NVarChar(255),req.body?.Description||null)
.input("ImageUrl",sql.NVarChar(sql.MAX),req.body?.ImageUrl||null)
.query(`
UPDATE Categories
SET
Name=@Name,
Description=@Description,
ImageUrl=@ImageUrl
WHERE Id=@Id;

SELECT *
FROM Categories
WHERE Id=@Id
`);

return res.json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Update category error:",error);
return res.status(500).json({
success:false,
message:"Failed to update category"
});
}
});

router.get("/banners",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const result=await pool.request().query(`
SELECT *
FROM Banners
ORDER BY DisplayOrder,Id
`);

return res.json({
success:true,
data:result.recordset
});

}catch(error){
console.error("Admin banners error:",error);
return res.status(500).json({
success:false,
message:"Failed to load banners"
});
}
});

router.post("/banners",auth,async(req,res)=>{
try{
const x=req.body||{};
const pool=await getDbPool();

const result=await pool.request()
.input("Title",sql.NVarChar(200),x.Title||null)
.input("Subtitle",sql.NVarChar(500),x.Subtitle||null)
.input("ImageUrl",sql.NVarChar(sql.MAX),x.ImageUrl)
.input("MobileImageUrl",sql.NVarChar(sql.MAX),x.MobileImageUrl||null)
.input("ButtonText",sql.NVarChar(100),x.ButtonText||null)
.input("ButtonLink",sql.NVarChar(300),x.ButtonLink||null)
.input("DisplayOrder",sql.Int,Number(x.DisplayOrder||0))
.input("IsActive",sql.Bit,x.IsActive!==false)
.query(`
INSERT INTO Banners
(
Title,
Subtitle,
ImageUrl,
MobileImageUrl,
ButtonText,
ButtonLink,
DisplayOrder,
IsActive
)
OUTPUT INSERTED.*
VALUES
(
@Title,
@Subtitle,
@ImageUrl,
@MobileImageUrl,
@ButtonText,
@ButtonLink,
@DisplayOrder,
@IsActive
)
`);

return res.status(201).json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Create banner error:",error);
return res.status(500).json({
success:false,
message:"Failed to create banner"
});
}
});

router.put("/banners/:id",auth,async(req,res)=>{
try{
const id=Number(req.params.id);
const x=req.body||{};

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid banner ID"
});
}

const pool=await getDbPool();

const result=await pool.request()
.input("Id",sql.Int,id)
.input("Title",sql.NVarChar(200),x.Title||null)
.input("Subtitle",sql.NVarChar(500),x.Subtitle||null)
.input("ImageUrl",sql.NVarChar(sql.MAX),x.ImageUrl)
.input("MobileImageUrl",sql.NVarChar(sql.MAX),x.MobileImageUrl||null)
.input("ButtonText",sql.NVarChar(100),x.ButtonText||null)
.input("ButtonLink",sql.NVarChar(300),x.ButtonLink||null)
.input("DisplayOrder",sql.Int,Number(x.DisplayOrder||0))
.input("IsActive",sql.Bit,x.IsActive!==false)
.query(`
UPDATE Banners
SET
Title=@Title,
Subtitle=@Subtitle,
ImageUrl=@ImageUrl,
MobileImageUrl=@MobileImageUrl,
ButtonText=@ButtonText,
ButtonLink=@ButtonLink,
DisplayOrder=@DisplayOrder,
IsActive=@IsActive,
UpdatedAt=GETUTCDATE()
WHERE Id=@Id;

SELECT *
FROM Banners
WHERE Id=@Id
`);

return res.json({
success:true,
data:result.recordset[0]
});

}catch(error){
console.error("Update banner error:",error);
return res.status(500).json({
success:false,
message:"Failed to update banner"
});
}
});

router.delete("/banners/:id",auth,async(req,res)=>{
try{
const id=Number(req.params.id);

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid banner ID"
});
}

const pool=await getDbPool();

await pool.request()
.input("Id",sql.Int,id)
.query(`
UPDATE Banners
SET
IsActive=0,
UpdatedAt=GETUTCDATE()
WHERE Id=@Id
`);

return res.json({
success:true,
message:"Banner disabled"
});

}catch(error){
console.error("Disable banner error:",error);
return res.status(500).json({
success:false,
message:"Failed to disable banner"
});
}
});

router.get("/orders",auth,async(req,res)=>{
try{
const pool=await getDbPool();

const result=await pool.request().query(`
SELECT
o.Id,
o.OrderDate,
o.TotalAmount,
o.Status,
c.FullName,
c.PhoneNumber,
c.Email,
c.DeliveryAddress,
c.Pincode
FROM Orders o
INNER JOIN Customers c
ON c.Id=o.CustomerId
ORDER BY o.OrderDate DESC
`);

return res.json({
success:true,
data:result.recordset
});

}catch(error){
console.error("Admin orders error:",error);
return res.status(500).json({
success:false,
message:"Failed to load orders"
});
}
});

router.put("/orders/:id/status",auth,async(req,res)=>{
const allowed=[
"Pending",
"Processing",
"Shipped",
"Delivered",
"Cancelled"
];

if(!allowed.includes(req.body?.Status)){
return res.status(400).json({
success:false,
message:"Invalid status"
});
}

try{
const id=Number(req.params.id);

if(!Number.isInteger(id)){
return res.status(400).json({
success:false,
message:"Invalid order ID"
});
}

const pool=await getDbPool();

await pool.request()
.input("Id",sql.Int,id)
.input("Status",sql.NVarChar(50),req.body.Status)
.query(`
UPDATE Orders
SET Status=@Status
WHERE Id=@Id
`);

return res.json({
success:true,
message:"Order status updated"
});

}catch(error){
console.error("Update order status error:",error);
return res.status(500).json({
success:false,
message:"Failed to update order"
});
}
});

return router;
}

module.exports=createAdminRouter;