const express = require("express");
const { recommend } = require("./engine");

const app = express();
app.use(express.json());

// AI endpoint
app.post("/analyze", (req, res) => {

    const { products, message } = req.body;

    const result = recommend(products, message);

    res.json({
        reply: "🧠 Smart AI Brain activated",
        ...result
    });
});

app.listen(7000, () => {
    console.log("AI Brain running on port 7000");
});
