import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    console.log(`\n➡️  ${req.method} ${req.url}`);
    if (Object.keys(req.body || {}).length) {
        console.log("📦 Body:", req.body);
    }
    next();
});

app.use("/api", routes);

const PORT = Number(process.env.PORT) || 3003;

const server = app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});

const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Closing server...`);
    server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGUSR2", shutdown);
