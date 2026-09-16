import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();
const PORT = Number(process.env.PORT || process.env.NODE_PORT || 4000);

app.listen(PORT, () => {
  console.info(
    JSON.stringify({
      msg: "edge_started",
      service: "namami-edge",
      port: PORT,
      data_mode: process.env.DATA_MODE || "FIXTURE",
    })
  );
});
