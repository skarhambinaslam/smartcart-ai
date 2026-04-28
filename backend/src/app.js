const express = require("express");
const cors = require("cors");

const app = express();

const productRoutes = require("./routes/productRoutes");

app.use("/api/products", productRoutes);

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({ message: "SmartCart AI Backend Running 🚀" });
});

module.exports = app;
