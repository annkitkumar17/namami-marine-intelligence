import axios from "axios";
import { AdvisoryResponseSchema } from "../schemas/contracts.js";
const BRAIN_URL = process.env.BRAIN_SERVICE_URL || "http://localhost:8000";
export class BrainClient {
    static async checkHealth() {
        const res = await axios.get(`${BRAIN_URL}/healthz`, { timeout: 3000 });
        return res.data;
    }
    static async askAdvisory(request) {
        const res = await axios.post(`${BRAIN_URL}/v1/ask`, request, { timeout: 5000 });
        return AdvisoryResponseSchema.parse(res.data);
    }
}
