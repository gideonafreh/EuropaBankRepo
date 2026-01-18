import fetch from "node-fetch";
import axios from "axios";
import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {spawn} from "node:child_process";


/* =========================================================
   ENV
========================================================= */
const BASE_URL = process.env.SIGNINGHUB_BASE_URL!;
const CLIENT_ID = process.env.SIGNINGHUB_CLIENT_ID!;
const CLIENT_SECRET = process.env.SIGNINGHUB_CLIENT_SECRET!;
const USERNAME = process.env.SIGNINGHUB_USERNAME!;
const PASSWORD = process.env.SIGNINGHUB_PASSWORD!;
const SIGNATURE_BASE64 = process.env.SIGNATURE_BASE64!;

/* =========================================================
   AUTH
========================================================= */
async function authenticate(): Promise<string> {
    console.log("Authenticating with SigningHub...");

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

    const token = res.data?.access_token;
    if (!token) {
        throw new Error("No access token returned from SigningHub");
    }

    console.log("Authentication successful");
    return token;
}

/* =========================================================
   DOCX → PDF CONVERTER (WINDOWS SAFE)
========================================================= */
/* =========================================================
   DOCX → PDF CONVERTER (LINUX / DOCKER SAFE)
========================================================= */
async function convertDocxToPdf(
    file: Express.Multer.File
): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
}> {
    console.log("Starting DOCX → PDF conversion");

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "lo-"));
    const inputPath = path.join(tmpDir, file.originalname);
    const outputPath = inputPath.replace(/\.(docx?|DOCX?)$/, ".pdf");
    const loProfileDir = path.join(tmpDir, "profile");
    await fs.mkdir(loProfileDir, { recursive: true });
    await fs.writeFile(inputPath, file.buffer);
    console.log("DOCX written to temp:", inputPath);

    const sofficePath = "soffice";

    await new Promise<void>((resolve, reject) => {
        const proc = spawn(
            sofficePath,
            [
                "--headless",
                "--nologo",
                "--nofirststartwizard",
                "--norestore",
                "--invisible",
                "--nodefault",
                "--nolockcheck",
                "--nocrashreport",
                "--safe-mode",
                `-env:UserInstallation=file://${loProfileDir}`,
                "--convert-to",
                "pdf",
                "--outdir",
                tmpDir,
                inputPath,
            ],
            {
                env: {
                    ...process.env,
                    HOME: loProfileDir,
                    LANG: "en_US.UTF-8",
                    LC_ALL: "en_US.UTF-8",
                    SAL_USE_VCLPLUGIN: "gen",
                    DBUS_SESSION_BUS_ADDRESS: "disabled",
                },
            }
        );
        let stderr = "";

        proc.stderr.on("data", (d) => {
            stderr += d.toString();
        });

        proc.on("error", reject);

        proc.on("close", async (code) => {
            if (code !== 0) {
                return reject(
                    new Error(
                        `LibreOffice failed with code ${code}\n${stderr}`
                    )
                );
            }

            try {
                await fs.access(outputPath);
                resolve();
            } catch {
                reject(
                    new Error(
                        "LibreOffice exited successfully but PDF not found"
                    )
                );
            }
        });
    });

    console.log("LibreOffice conversion finished");

    const pdfBuffer = await fs.readFile(outputPath);

    return {
        buffer: pdfBuffer,
        filename: file.originalname.replace(/\.(docx?|DOCX?)$/, ".pdf"),
        mimetype: "application/pdf",
    };
}

/* =========================================================
   PACKAGE CREATION
========================================================= */
async function createPackage(): Promise<number> {
    console.log("Creating SigningHub package...");

    const token = await authenticate();

    const res = await axios.post(
        `${BASE_URL}/v4/packages`,
        {
            package_name: "Tight Integration Package",
            workflow_mode: "ME_AND_OTHERS",
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        }
    );

    const packageId = res.data.package_id;
    console.log("Package created:", packageId);

    return packageId;
}

/* =========================================================
   DOCUMENT UPLOAD (BINARY – POSTMAN STYLE)
========================================================= */
async function uploadDocumentToPackage(
    packageId: number,
    file: Express.Multer.File
): Promise<number> {

    console.log("=== SIGNINGHUB UPLOAD START ===");

    console.log("Upload input:", {
        packageId,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
    });

    const token = await authenticate();

    const url = `${BASE_URL}/v4/packages/${packageId}/documents`;

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
        "x-file-name": file.originalname, // 🔥 REQUIRED
        "x-source": "API",
        "Content-Length": file.size.toString(),
    };

    console.log("Outgoing headers:");
    Object.entries(headers).forEach(([k, v]) =>
        console.log(`  ${k}: ${v}`)
    );

    console.log("POST", url);
    console.log("Sending raw binary body");

    const res = await fetch(url, {
        method: "POST",
        headers,
        body: file.buffer,
    });

    console.log("HTTP response:", {
        status: res.status,
        statusText: res.statusText,
    });

    const text = await res.text();
    console.log("Raw response body:", text);

    if (!res.ok) {
        throw new Error(`SigningHub error ${res.status}: ${text}`);
    }

    const json = JSON.parse(text);

    console.log("Upload response JSON:", json);

// 🔥 SigningHub returns `documentid` (lowercase, no underscore)
    const documentId = json.documentid;

    if (!documentId) {
        throw new Error(
            `SigningHub did not return documentid. Response: ${text}`
        );
    }

    console.log("Resolved documentId:", documentId);

    return documentId;

}

/* =========================================================
   CONTROLLER
========================================================= */
export async function uploadDocumentController(
    req: Request,
    res: Response
) {
    try {
        console.log("=== CONTROLLER START ===");

        if (!req.file) {
            console.error("No file received from frontend");
            return res.status(400).json({ error: "No file uploaded" });
        }

        const packageId = await createPackage();

        console.log("Preparing document for upload");

        let fileToUpload: Express.Multer.File = req.file;

        if (
            req.file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            console.log("DOCX detected → converting to PDF");

            const converted = await convertDocxToPdf(req.file);

            fileToUpload = {
                ...req.file,
                buffer: converted.buffer,
                originalname: converted.filename,
                mimetype: converted.mimetype,
                size: converted.buffer.length,
            } as Express.Multer.File;

            console.log("Conversion completed:", {
                filename: fileToUpload.originalname,
                size: fileToUpload.size,
            });
        } else {
            console.log("No conversion needed");
        }

        const documentId = await uploadDocumentToPackage(
            packageId,
            fileToUpload
        );


        console.log("Controller finished successfully");

        console.log("UPLOAD CONTROLLER RESPONSE:", {
            packageId,
            documentId,
        });
        res.json({ packageId, documentId });

        console.log("Upload completed:", {
            packageId,
            documentId,
        });
    } catch (error) {
        console.error("UPLOAD CONTROLLER ERROR:", error);
        res.status(500).json({ error: "Upload failed" });
    }
}


/* =========================================================
   Sign Document
========================================================= */

async function signDocument(
    packageId: number,
    documentId: number,
    signerName: string
): Promise<void> {
    const fieldName = await createSignatureField(
        packageId,
        documentId,
        signerName
    );
    console.log("=== DOCUMENT SIGNING START ===");
    console.log("Package ID:", packageId);
    console.log("Document ID:", documentId);
    console.log("Signature field_name:", fieldName);

    const token = await authenticate();
    console.log("Authentication successful");

    const url = `${BASE_URL}/v4/packages/${packageId}/documents/${documentId}/sign`;
    console.log("POST", url);

    const payload = {
        field_name: fieldName,
        hand_signature_image: SIGNATURE_BASE64,

    };

    console.log("Signing payload:", payload);

    const res = await axios.post(url, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        validateStatus: () => true, // 🔥 allow us to inspect status ourselves
    });

    console.log("Signing HTTP status:", res.status);
    console.log("Signing raw response:", res.data ?? "<empty>");

    // ✅ Explicit success handling
    if (res.status === 200 || res.status === 204) {
        console.log("✅ DOCUMENT SIGNED SUCCESSFULLY");
        console.log("=== DOCUMENT SIGNING END ===");
        return;
    }

    // ❌ Explicit failure
    console.error("❌ DOCUMENT SIGNING FAILED");
    throw new Error(
        `Signing failed with status ${res.status}: ${JSON.stringify(res.data)}`
    );
}



async function createSignatureField(
    packageId: number,
    documentId: number,
    signerName: string
): Promise<string> {

    console.log("=== CREATE SIGNATURE FIELD START ===");

    const token = await authenticate();

    const fieldName = `${signerName}_signature`;

    const url = `${BASE_URL}/v4/packages/${packageId}/documents/${documentId}/fields/signature`;

    const payload = {
        field_name: fieldName,
        order: 1,
        page_no: 1,
        display: "VISIBLE",
        level_of_assurance: ["ELECTRONIC_SIGNATURE"],
        dimensions: {
            x: 200,
            y: 200,
            width: 150,
            height: 100,
        },
    };

    console.log("Creating signature field:", {
        url,
        payload,
    });

    const res = await axios.post(url, payload, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });

    console.log("Signature field created successfully:", res.data);

    console.log("=== CREATE SIGNATURE FIELD END ===");

    return fieldName;
}


/* =========================================================
   SIGN DOCUMENT CONTROLLER
========================================================= */

export async function signDocumentController(
    req: Request,
    res: Response
) {
    try {
        console.log("Sign request received:", req.body);

        const { packageId, documentId, signerName } = req.body;

        if (!packageId || !documentId || !signerName) {
            return res.status(400).json({
                error: "packageId, documentId and signerName are required",
            });
        }

        await signDocument(
            Number(packageId),
            Number(documentId),
            signerName
        );

        console.log("✅ BACKEND: Sign flow completed successfully");

        res.json({ success: true });
    } catch (error) {
        console.error("❌ SIGN DOCUMENT ERROR:", error);
        res.status(500).json({ error: "Signing failed" });
    }




}


/* =========================================================
   DOWNLOAD PACKAGE
========================================================= */



/* =========================================================
   DOWNLOAD PDF CONTROLLER
========================================================= */



async function downloadSignedPackageBinary(packageId: number): Promise<Buffer> {
    console.log("Downloading package from SigningHub:", packageId);

    const token = await authenticate();

    const res = await axios.get(
        `${BASE_URL}/v4/packages/${packageId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
            responseType: "arraybuffer", // 🔥 REQUIRED
        }
    );

    console.log("SigningHub download response:");
    console.log("Status:", res.status);
    console.log("Byte length:", res.data.byteLength);

    return Buffer.from(res.data);
}


export async function downloadPackageController(req: Request, res: Response) {
    try {
        const packageId = Number(req.params.packageId);
        const signerName = String(req.query.signerName || "signer");

        console.log("Download request:", { packageId, signerName });

        const pdfBuffer = await downloadSignedPackageBinary(packageId);

        const safeSigner = signerName.replace(/[^a-z0-9_-]/gi, "_");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${safeSigner}-signed-package-${packageId}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        res.end(pdfBuffer);
    } catch (err) {
        console.error("DOWNLOAD ERROR:", err);
        res.status(500).json({ error: "Download failed" });
    }
}



