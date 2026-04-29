const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// AI Mock endpoint
app.post("/chat", (req, res) => {
    const msg = req.body.message;

    res.json({
        reply: "🤖 Mock AI: Tum ne kaha: " + msg + " → Suggested: Gaming Laptop, Headphones, Mouse"
    });
});

// Start server
app.listen(6000, () => {
    console.log("AI Service running on port 6000");
});
