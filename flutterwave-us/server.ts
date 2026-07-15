import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI with API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API route for AI Assistant
app.post("/api/assistant", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request. 'messages' array is required." });
    }

    // Format the messages for @google/genai SDK
    const formattedContents = messages.map(msg => {
      // @google/genai contents role must be "user" or "model" (not "assistant")
      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: `You are WaveAI, the official Flutterwave Global Commerce & Payments Assistant. Your role is to help US and global businesses understand how to expand their operations, accept payments, and send payouts across Africa, the US, and worldwide.

Flutterwave Key Information:
- Core Mission: "Endless possibilities for every business." Connecting African businesses to the world and global businesses to Africa.
- US Focus: Helping US corporations, enterprises, and startups seamlessly expand into Africa.
- Reach: Active in 34+ African countries (including Nigeria, Kenya, South Africa, Ghana, Egypt, Uganda, Rwanda, Senegal, Cote d'Ivoire, Cameroon, etc.).
- Currencies: Supports 150+ currencies globally, enabling localized card checkouts and payout settlement in USD, EUR, GBP, NGN, KES, ZAR, etc.
- Core Products:
  1. Payments: Accept payments via Card, Bank Transfer, Apple Pay, Google Pay, and localized African methods like Mobile Money (M-Pesa, MTN MoMo, Airtel Money, Orange Money) and bank apps (e.g. Bank transfers in Nigeria).
  2. Payouts: Send automated mass payments or single transfers to bank accounts and mobile money wallets across Africa instantly.
  3. Flutterwave Store: Set up beautiful online stores to sell products and services.
  4. Flutterwave Capital: Collateral-free growth loans for active merchants.
  5. Developer APIs: Robust, developer-first REST APIs, SDKs (Node, Python, PHP), and beautiful documentation.
- Compliance & Security: Highly regulated. Licensed as a Money Transmitter in multiple US states. PCI-DSS Level 1 Compliant, SOC 2 Type II Certified, and features the Flutterwave Shield (advanced AI-driven fraud engine).

Tone guidelines:
- Be professional, welcoming, highly knowledgeable, and clear.
- Keep your answers concise, practical, and structured (use lists and bullet points if they improve clarity).
- Never make up information. If you don't know something, offer to guide them to Flutterwave's official sales or developer documentation.
- Keep responses friendly but executive, reinforcing that Flutterwave makes African global commerce incredibly simple, safe, and efficient.`
      }
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error in AI assistant endpoint:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

// Mock Endpoint for Payment Simulation
app.post("/api/payment/simulate", (req, res) => {
  const { amount, currency, email, cardName, paymentMethod } = req.body;
  
  if (!amount || !currency || !email) {
    return res.status(400).json({ error: "Amount, currency, and email are required." });
  }

  // Generate a random mock transaction ID
  const txRef = "FLW-MOCK-" + Math.random().toString(36).substring(2, 11).toUpperCase();
  const date = new Date().toISOString();

  // Simulate payment processing latency
  setTimeout(() => {
    res.json({
      status: "success",
      message: "Payment processed successfully (Simulation)",
      data: {
        id: Math.floor(Math.random() * 10000000),
        txRef,
        amount: parseFloat(amount),
        currency,
        email,
        paymentMethod: paymentMethod || "card",
        cardName: cardName || "Demo Cardholder",
        deviceFingerprint: "flw-dfp-" + Math.random().toString(36).substring(2, 15),
        created_at: date,
        auth_model: "3DSecure",
        status: "successful",
        charge_response_code: "00",
        charge_response_message: "Approved"
      }
    });
  }, 1500);
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
