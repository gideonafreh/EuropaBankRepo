import dotenv from "dotenv";
dotenv.config();

process.env.LIBREOFFICE_PATH =
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

process.env.URE_BOOTSTRAP =
    "vnd.sun.star.pathname:C:\\Program Files\\LibreOffice\\program\\fundamental.ini";
import express from "express";
import cors from "cors";
import routes from "./routes";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

const PORT = Number(process.env.PORT) || 3003;



// ✅ Keep a reference to the server
const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

// ✅ Graceful shutdown (CRITICAL for ts-node-dev)
const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Closing server...`);

    server.close(() => {
        console.log("Server closed. Port released.");
        process.exit(0);
    });
};

// ts-node-dev + Windows need ALL of these
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGUSR2", shutdown);
