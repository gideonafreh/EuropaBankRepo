import fetch from "node-fetch";
import axios from "axios";
import { Request, Response } from "express";

/* =========================================================
   ENV
========================================================= */
const BASE_URL = process.env.SIGNINGHUB_BASE_URL!;
const CLIENT_ID = process.env.SIGNINGHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.SIGNINGHUB_CLIENT_SECRET!;
const USERNAME = process.env.SIGNINGHUB_USERNAME!;
const PASSWORD = process.env.SIGNINGHUB_PASSWORD!;

/* =========================================================
   AUTH
========================================================= */
async function authenticate(): Promise<string> {
    console.log("🔐 Authenticating with SigningHub...");

    const form = new URLSearchParams();
    form.append("grant_type", "password");
    form.append("client_id", CLIENT_ID);
    form.append("client_secret", CLIENT_SECRET);
    form.append("username", USERNAME);
    form.append("password", PASSWORD);

    const res = await axios.post(`${BASE_URL}/authenticate`, form, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
    });

    if (!res.data?.access_token) {
        console.error("❌ Authentication failed:", res.data);
        throw new Error("Authentication failed");
    }

    console.log("✅ Authentication OK");
    return res.data.access_token;
}

/* =========================================================
   CREATE PACKAGE
========================================================= */
async function createPackage(): Promise<number> {
    console.log("📦 Creating package...");

    const token = await authenticate();

    const res = await axios.post(
        `${BASE_URL}/v4/packages`,
        {
            package_name: "Quick Integration Package",
            workflow_mode: "ME_AND_OTHERS",
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    console.log("📦 Package created:", res.data);
    return res.data.package_id;
}

/* =========================================================
   UPLOAD DOCUMENT
========================================================= */
async function uploadDocumentToPackage(
    packageId: number,
    file: Express.Multer.File
): Promise<number> {
    console.log(`📄 Uploading document to package ${packageId}`);

    const token = await authenticate();

    const res = await fetch(
        `${BASE_URL}/v4/packages/${packageId}/documents`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/octet-stream",
                "x-file-name": file.originalname,
                "x-source": "API",
                "Content-Length": file.size.toString(),
            },
            body: file.buffer,
        }
    );

    const text = await res.text();
    console.log("📄 Upload response:", text);

    if (!res.ok) {
        throw new Error(`Document upload failed: ${text}`);
    }

    const json = JSON.parse(text);
    return json.documentid;
}

/* =========================================================
   START WORKFLOW
========================================================= */
async function startWorkflow(packageId: number) {
    console.log(`▶️ Starting workflow for package ${packageId}`);

    const token = await authenticate();

    const res = await axios.post(
        `${BASE_URL}/v4/packages/${packageId}/workflow`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    console.log("▶️ Workflow started:", res.data);
}

/* =========================================================
   CREATE IFRAME LINK (CORRECT API)
========================================================= */
async function createIframeLink(packageId: number): Promise<string> {
    console.log("🖥️ Creating SigningHub iframe link...");

    const token = await authenticate();

    const payload = {
        package_id: packageId,
        language: "en-US",
        response_type: "PLAIN",
        collapse_panels: true,
    };

    console.log("🖥️ iframe payload:", payload);

    const res = await axios.post(
        `${BASE_URL}/v4/links/integration`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    console.log("🖥️ iframe response:", res.data);

    // 🔥 FIX: response is a STRING, not { url: ... }
    if (typeof res.data !== "string") {
        throw new Error("SigningHub did not return iframe URL string");
    }

    return res.data;
}


/* =========================================================
   UPLOAD CONTROLLER
========================================================= */
export async function uploadDocumentController(req: Request, res: Response) {
    try {
        console.log("⬆️ Upload controller started");

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 1️⃣ Create package
        const packageId = await createPackage();

        // 2️⃣ Upload document ONCE and get documentId
        const documentId = await uploadDocumentToPackage(packageId, req.file);

        // 3️⃣ Create required signature field
        await createSignatureField(packageId, documentId);

        console.log("⬆️ Upload flow completed", {
            packageId,
            documentId,
        });

        res.json({ packageId });
    } catch (err) {
        console.error("❌ Upload error:", err);
        res.status(500).json({ error: "Upload failed" });
    }
}


/* =========================================================
   IFRAME CONTROLLER
========================================================= */
export async function getIframeController(req: Request, res: Response) {
    try {
        const { packageId } = req.body;

        if (!packageId) {
            return res.status(400).json({ error: "packageId required" });
        }

        await startWorkflow(Number(packageId));
        const iframeUrl = await createIframeLink(Number(packageId));

        console.log("🖥️ iframe URL:", iframeUrl);

        res.json({ iframeUrl });
    } catch (err) {
        console.error("❌ iframe error:", err);
        res.status(500).json({ error: "Failed to create iframe" });
    }
}

/* =========================================================
   DOWNLOAD
========================================================= */
async function downloadPackageBinary(packageId: number): Promise<Buffer> {
    console.log(`⬇️ Downloading package ${packageId}`);

    const token = await authenticate();

    const res = await axios.get(
        `${BASE_URL}/v4/packages/${packageId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            responseType: "arraybuffer",
        }
    );

    console.log("⬇️ Download OK");
    return Buffer.from(res.data);
}

export async function downloadPackageController(req: Request, res: Response) {
    try {
        const packageId = Number(req.params.packageId);

        const pdfBuffer = await downloadPackageBinary(packageId);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="signed-package-${packageId}.pdf"`
        );

        res.end(pdfBuffer);
    } catch (err) {
        console.error("❌ Download error:", err);
        res.status(500).json({ error: "Download failed" });
    }
}


async function createSignatureField(
    packageId: number,
    documentId: number
) {
    console.log("✍️ Creating signature field...");

    const token = await authenticate();

    const payload = {
        field_name: "signature_1",
        order: 1,
        page_no: 1,
        display: "VISIBLE",
        level_of_assurance: ["QUALIFIED_ELECTRONIC_SIGNATURE"],
        dimensions: {
            x: 40,
            y: 360,
            width: 150,
            height: 60,
        },
    };

    const res = await axios.post(
        `${BASE_URL}/v4/packages/${packageId}/documents/${documentId}/fields/signature`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        }
    );

    console.log("✍️ Signature field created:", res.data);
}
