import axios from "axios";
import { AskRequest, AdvisoryResponse, AdvisoryResponseSchema } from "../schemas/contracts.js";

const BRAIN_URL = process.env.BRAIN_SERVICE_URL || "http://localhost:8000";

export class BrainClient {
  static async checkHealth(): Promise<{ status: string }> {
    const res = await axios.get(`${BRAIN_URL}/healthz`, { timeout: 3000 });
    return res.data;
  }

  static async askAdvisory(request: AskRequest): Promise<AdvisoryResponse> {
    const res = await axios.post(`${BRAIN_URL}/v1/ask`, request, { timeout: 5000 });
    return AdvisoryResponseSchema.parse(res.data);
  }
}
