import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health.js";
import { AskRequestSchema } from "./schemas/contracts.js";
import { BrainClient } from "./clients/brainClient.js";
import { encodeNavIC25Byte, decodeNavIC25Byte } from "./navic/wire.js";
dotenv.config();
const app = express();
const PORT = process.env.NODE_PORT || 4000;
app.use(cors());
app.use(express.json());
app.use("/", healthRouter);
app.post("/v1/ask", async (req, res) => {
    try {
        const validatedRequest = AskRequestSchema.parse(req.body);
        const advisory = await BrainClient.askAdvisory(validatedRequest);
        res.json(advisory);
    }
    catch (err) {
        res.status(400).json({ error: "Validation or Brain Service error", details: err.message });
    }
});
app.get("/v1/navic/outbox", (req, res) => {
    const packetHex = encodeNavIC25Byte(9.28, 79.12, "GO", 0.8, 12.0, 0);
    const decoded = decodeNavIC25Byte(packetHex);
    res.json({
        raw_hex: packetHex,
        byte_count: 25,
        simulation: true,
        decoded,
    });
});
app.listen(PORT, () => {
    console.log(`NAMAMI Edge Gateway listening on port ${PORT}`);
});
