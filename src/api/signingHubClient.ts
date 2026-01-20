import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
});

export async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/api/upload", formData);
    return res.data; // { packageId }
}

export async function getSigningIframe(packageId: string) {
    const res = await api.post("/api/iframe", { packageId });
    return res.data.iframeUrl;
}

export async function downloadSignedPackage(packageId: number) {
    const res = await api.get(`/api/download/${packageId}`, {
        responseType: "arraybuffer",
    });
    return res.data;
}
export async function getPackageStatus(packageId: number) {
    const res = await api.get(`/api/status/${packageId}`);
    return res.data.status;
}
