const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// AI Smart Chat
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    try {
        // 1️⃣ Backend se products lao
        const productsResponse = await axios.get(
            "http://backend:5000/api/products"
        );

        const products = productsResponse.data;

        // 2️⃣ Simple Smart Logic (initial AI brain)
        let suggestions = products.filter(p =>
            userMessage.toLowerCase().includes("laptop")
                ? p.name.toLowerCase().includes("laptop")
                : true
        );

        // 3️⃣ Response generate
        res.json({
            query: userMessage,
            suggestions: suggestions.length ? suggestions : products,
            reply: "🤖 Smart AI ne DB se products analyze kar liye"
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(6000, () => {
    console.log("AI Smart Service running on port 6000");
});
