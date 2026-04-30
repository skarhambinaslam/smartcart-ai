const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   🛡️ GLOBAL ERROR HANDLING
========================= */
process.on("uncaughtException", (err) => {
    console.log("❌ CRASH:", err.message);
});

process.on("unhandledRejection", (err) => {
    console.log("❌ PROMISE ERROR:", err.message);
});


/* =========================
   🌐 FRONTEND SERVE
========================= */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


/* =========================
   🧠 AUTH - REGISTER
========================= */
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
            [name, email, hash]
        );

        res.json({ status: "user registered" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* =========================
   🔑 LOGIN
========================= */
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: "user not found" });
        }

        const valid = await bcrypt.compare(password, user.rows[0].password);

        if (!valid) {
            return res.status(400).json({ error: "wrong password" });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, email },
            "secretkey"
        );

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* =========================
   🧠 MEMORY SAVE
========================= */
app.post("/memory", async (req, res) => {
    try {
        const { user_id, preference, last_query } = req.body;

        await pool.query(
            "INSERT INTO user_memory (user_id, preference, last_query) VALUES ($1,$2,$3)",
            [user_id, preference, last_query]
        );

        res.json({ status: "memory saved" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* =========================
   🛒 CART SYSTEM
========================= */
app.post("/cart", async (req, res) => {
    try {
        const { user_id, product_name, price } = req.body;

        await pool.query(
            "INSERT INTO cart (user_id, product_name, price) VALUES ($1,$2,$3)",
            [user_id, product_name, price]
        );

        res.json({ status: "added to cart" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* =========================
   💬 CHAT ENDPOINT (ADDED)
========================= */
app.post("/chat", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message) {
            return res.status(400).json({ error: "message required" });
        }

        let productList = [];

        try {
            const response = await axios.get("http://smartcart-ai-backend-1:5000/api/products");
            productList = response.data || [];
        } catch (err) {
            console.log("⚠ Backend not reachable:", err.message);
            productList = [];
        }

        const suggestions = productList.filter(p =>
            message.toLowerCase().includes("laptop")
                ? p.name.toLowerCase().includes("laptop")
                : true
        );

        res.json({
            query: message,
            suggestions,
            reply: "🤖 Smart AI chat response generated"
        });

    } catch (err) {
        console.log("❌ CHAT ERROR:", err.message);
        res.status(500).json({
            error: "chat service failed",
            details: err.message
        });
    }
});


/* =========================
   🧠 AI ENGINE
========================= */
app.post("/analyze", async (req, res) => {
    try {
        const { message, products } = req.body;

        if (!message) {
            return res.status(400).json({ error: "message required" });
        }

        let productList = products || [];

        if (!products) {
            try {
                const response = await axios.get("http://smartcart-ai-backend-1:5000/api/products");
                productList = response.data;
            } catch (err) {
                console.log("⚠ Backend not reachable:", err.message);
                productList = [];
            }
        }

        const intent = detectIntent(message);
        const budget = extractBudget(message);

        const suggestions = productList
            .filter(p => isRelevant(p, intent))
            .map(p => ({
                ...p,
                score: scoreProduct(p, intent, budget),
                reason: explain(p, intent, budget)
            }))
            .sort((a, b) => b.score - a.score);

        const bundle = buildBundle(intent, budget);

        res.json({
            reply: "🧠 Smart AI Brain activated",
            query: message,
            intent,
            budget,
            bundle,
            suggestions: suggestions || []
        });

    } catch (err) {
        console.log("❌ ANALYZE ERROR:", err.message);
        res.status(500).json({
            error: "AI service failed",
            details: err.message
        });
    }
});


/* =========================
   🧠 CORE FUNCTIONS
========================= */

function detectIntent(message) {
    message = message.toLowerCase();

    if (message.includes("gaming")) return "gaming";
    if (message.includes("office")) return "office";
    if (message.includes("mouse")) return "accessory";

    return "general";
}

function extractBudget(message) {
    const nums = message.match(/\d+/g);
    if (!nums) return null;
    return parseInt(nums[nums.length - 1]);
}

function isRelevant(product, intent) {
    const name = product.name.toLowerCase();

    if (intent === "gaming" && name.includes("gaming")) return true;
    if (intent === "office" && name.includes("office")) return true;
    if (intent === "accessory" && name.includes("mouse")) return true;

    return true;
}

function scoreProduct(product, intent, budget) {
    let score = 0;
    const name = product.name.toLowerCase();

    if (intent === "gaming" && name.includes("gaming")) score += 10;
    if (intent === "office" && name.includes("office")) score += 10;
    if (name.includes("laptop")) score += 5;

    if (budget) {
        if (product.price <= budget) score += 10;
        else score -= 5;
    }

    return score;
}

function explain(product, intent, budget) {
    let reasons = [];

    if (product.name.toLowerCase().includes(intent)) {
        reasons.push("matches requirement");
    }

    if (budget && product.price <= budget) {
        reasons.push("within budget");
    }

    return reasons.join(", ");
}

function buildBundle(intent, budget) {
    let bundle = [];

    if (intent === "gaming") {
        bundle.push({ name: "Gaming Laptop", price: 120000 });
        bundle.push({ name: "Gaming Mouse", price: 3000 });
        bundle.push({ name: "Gaming Headset", price: 8000 });
    }

    if (intent === "office") {
        bundle.push({ name: "Office Laptop", price: 90000 });
        bundle.push({ name: "Mouse", price: 1000 });
    }

    return bundle;
}


/* =========================
   🚀 START SERVER
========================= */
app.listen(6000, () => {
    console.log("🧠 Backend running on port 6000");
});