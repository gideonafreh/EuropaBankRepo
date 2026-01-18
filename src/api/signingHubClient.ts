// src/api/signingHubClient.ts
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
})
export type UploadResponse = {
    packageId: string;
    documentId: string;
};

export async function uploadFile(file: File) {
    const formData = new FormData();
    console.log(file.name, file.type, file.size);
    // 🔑 FIELD NAME MUST BE "file"
    formData.append("file", file, file.name);

    const res = await api.post("/api/upload", formData);

    console.log("Upload API response:", res.data);

    return {
        packageId: res.data.packageId,
        documentId: res.data.documentId,
    };
}

export async function signDocument(
    packageId: string,
    documentId: string,
    signerName: string
) {
    const res = await api.post("/api/sign", {
        packageId,
        documentId,
        signerName,
    });

    return res.data;
}


export async function downloadSignedPackage(packageId: number) {
    console.log("Downloading signed package:", packageId);

    const res = await api.get(`/api/download/${packageId}`, {
        responseType: "arraybuffer",
    });

    console.log("Download response type:", res.data.constructor.name);

    return res.data; // ArrayBuffer ONLY
}
