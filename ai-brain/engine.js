function analyzeIntent(message) {
    message = message.toLowerCase();

    if (message.includes("gaming")) return "gaming";
    if (message.includes("office")) return "office";
    if (message.includes("mouse")) return "accessory";

    return "general";
}

function extractBudget(message) {
    const numbers = message.match(/\d+/g);
    if (!numbers) return null;

    return parseInt(numbers[numbers.length - 1]);
}

function isRelevant(product, intent) {
    const name = product.name.toLowerCase();

    if (intent === "gaming" && name.includes("laptop")) return true;
    if (intent === "office" && name.includes("laptop")) return true;
    if (intent === "accessory" && name.includes("mouse")) return true;

    return false;
}

function scoreProduct(product, intent, budget) {
    let score = 0;
    const name = product.name.toLowerCase();

    // 🎯 Intent matching
    if (intent === "gaming" && name.includes("gaming")) score += 10;
    if (intent === "office" && name.includes("office")) score += 10;

    // 💻 Category boost
    if (name.includes("laptop")) score += 5;
    if (name.includes("mouse")) score += 3;

    // 💰 Budget logic
    if (budget) {
        if (product.price <= budget) {
            score += 10;   // best match
        } else {
            score -= 5;    // penalty for over budget
        }
    } else {
        // 🧠 no budget = slight neutral boost
        score += 2;
    }

    // ⭐ Extra intelligence (NEW)
    // cheaper = slightly better value score
    if (budget && product.price < budget * 0.8) {
        score += 3;
    }

    return score;
}

function explain(product, intent, budget) {
    let reasons = [];

    const name = product.name.toLowerCase();

    if (
        (intent === "gaming" && name.includes("gaming")) ||
        (intent === "office" && name.includes("office"))
    ) {
        reasons.push("matches your requirement");
    }

    if (budget && product.price <= budget) {
        reasons.push("within your budget");
    }

    return reasons.length ? reasons.join(", ") : "recommended based on popularity";
}

function recommend(products, message) {

    const intent = analyzeIntent(message);
    const budget = extractBudget(message);

    const bundleIntent = detectBundleIntent(message);
    // const bundle = buildBundle(bundleIntent);
    const bundle = buildBundle(intent, budget);
    const pricing = calculateSavings(bundle);

    const filtered = products.filter(p => isRelevant(p, intent));

    const ranked = filtered
        .map(p => ({
            ...p,
            score: scoreProduct(p, intent, budget),
            reason: explain(p, intent, budget)
        }))
        .sort((a, b) => b.score - a.score);

    const top = ranked.slice(0, 3);

  return {
    reply: buildReply(intent, budget, top[0], bundle),
    intent,
    budget,
    bundle,
    bundle_reason: explainBundle(intent, budget),
    recommendations: top,
    pricing: calculateSavings(bundle)   // 💰 NEW MONEY LAYER
};
}


function detectBundleIntent(message) {
    message = message.toLowerCase();

    if (message.includes("gaming")) return "gaming_bundle";
    if (message.includes("office")) return "office_bundle";
    if (message.includes("setup")) return "setup_bundle";

    return "single";
}

function buildBundle(intent, budget) {

    if (intent === "gaming") {

        if (budget && budget <= 150000) {
            return [
                { name: "Budget Gaming Laptop", price: 120000 },
                { name: "Gaming Mouse", price: 3000 }
            ];
        }

        return [
            { name: "Gaming Laptop", price: 200000 },
            { name: "Gaming Mouse", price: 5000 },
            { name: "Gaming Headset", price: 8000 }
        ];
    }

    if (intent === "office") {

        if (budget && budget <= 100000) {
            return [
                { name: "Office Laptop (Budget)", price: 80000 },
                { name: "Basic Mouse", price: 1500 }
            ];
        }

        return [
            { name: "Office Laptop", price: 120000 },
            { name: "Keyboard + Mouse", price: 3000 }
        ];
    }

    return [];
}

function explainBundle(intent, budget) {

    if (intent === "gaming") {
        if (budget && budget <= 150000) {
            return "Budget optimized gaming setup under your limit";
        }

        return "Complete gaming setup with optimized performance and accessories";
    }

    if (intent === "office") {
        return "Productivity focused office bundle for work efficiency";
    }

    return "Recommended setup based on your requirement";
}

function buildReply(intent, budget, topProduct, bundle) {

    let reply = "";

    if (intent === "gaming") {

        if (!budget) {
            reply = `I found a complete gaming setup for you. Since you didn't mention a budget, I selected a balanced high-performance setup for you.`;
        } 
        else if (budget <= 150000) {
            reply = `Based on your budget, I selected an optimized gaming setup that gives you best value under your limit.`;
        } 
        else {
            reply = `You have a strong budget, so I picked a high-performance gaming setup for maximum experience.`;
        }
    }

    else if (intent === "office") {
        reply = `I selected a productivity-focused office setup optimized for daily work efficiency.`;
    }

    else {
        reply = `I found the best matching products based on your requirement.`;
    }

    return reply;
}

function calculateTotal(bundle) {
    return bundle.reduce((sum, item) => sum + item.price, 0);
}

function calculateSavings(bundle) {

    let total = calculateTotal(bundle);

    // fake market comparison (future: DB se aayega)
    let marketPrice = total + (total * 0.10); // 10% higher market price

    let savings = marketPrice - total;

    return {
        total,
        marketPrice,
        savings
    };
}


module.exports = { recommend };