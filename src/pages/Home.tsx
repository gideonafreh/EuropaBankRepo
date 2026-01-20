import {useEffect, useState} from "react";
import {NameInput} from "../components/NameInput";
import {FileUpload} from "../components/FileUpload";
import {getSigningIframe} from "../api/signingHubClient";
import {uploadFile} from "../api/signingHubClient";
import {downloadSignedPackage} from "../api/signingHubClient";
import {SigningIframeModal} from "../components/IframeModal";
import {LoadingOverlay} from "../components/LoadingOverlay";
import { getPackageStatus } from "../api/signingHubClient";

import logo from "../assets/pngwing.png";
import europaBg from "../assets/vecteezy_yellow-blue-black-gradient-background_10547429.jpg";
import {fireConfetti} from "../Util/Confetti.ts";

export function Home() {
    const [name, setName] = useState("");
    const [packageId, setPackageId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [uploaded, setUploaded] = useState(false);
    const [signed, setSigned] = useState(false);
    const [loading, setLoading] = useState(false);

    // ✅ THIS STATE IS NOW ACTUALLY USED
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    useEffect(() => {
        if (signed) {
            fireConfetti();
        }
    }, [signed]);


    function startSigningStatusPolling(packageId: number) {
        const interval = setInterval(async () => {
            try {
                const status = await getPackageStatus(Number(packageId));

                console.log("📦 Signing status:", status);

                if (status === "COMPLETED") {
                    clearInterval(interval);

                    setIframeUrl(null);
                    setSigned(true);
                    fireConfetti();
                }
            } catch (err) {
                console.error("Status polling error:", err);
            }
        }, 3000); // every 3 seconds
    }


    /* ===============================
       SIGNING IFRAME
    =============================== */
    async function openSigningIframe() {
        if (!packageId) return;

        setLoading(true);
        try {
            const url = await getSigningIframe(packageId);
            setIframeUrl(url);
            startSigningStatusPolling(Number(packageId));

        } finally {
            setLoading(false);
        }
    }

    /* ===============================
       DOWNLOAD
    =============================== */
    async function handleDownload() {
        if (!packageId || !name.trim()) return;

        setLoading(true);
        try {
            const buffer = await downloadSignedPackage(Number(packageId));
            const blob = new Blob([buffer], {type: "application/pdf"});

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${name}-signed-package-${packageId}.pdf`;
            document.body.appendChild(a);
            a.click();

            a.remove();
            URL.revokeObjectURL(url);
        } finally {
            setLoading(false);
        }
    }

    /* ===============================
       UPLOAD
    =============================== */
    async function createPackageWithDocument() {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const response = await uploadFile(selectedFile);
            setPackageId(response.packageId);
            setUploaded(true);
        } finally {
            setLoading(false);
        }
    }

    /* ===============================
       UI
    =============================== */
    return (
        <>
            <LoadingOverlay visible={loading} message="Processing document…"/>

            {/* ✅ IFRAME MODAL — THIS FIXES YOUR ERROR */}
            {iframeUrl && (
                <SigningIframeModal
                    iframeUrl={iframeUrl}
                    onClose={() => {
                        setIframeUrl(null);
                        // setSigned(true);
                        // fireConfetti();
                    }}
                />
            )}

            <div
                className="container-fluid"
                style={{
                    backgroundImage: `url(${europaBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div className="row min-vh-100 justify-content-center align-items-center">
                    <div className="col-11 col-sm-8 col-md-6 col-lg-4">
                        <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5">
                            <div className="text-center mb-4">
                                <img src={logo} alt="Europa Bank Logo" style={{maxWidth: "300px"}}/>
                                <h2 className="h6 text-muted">Document Integration Portal</h2>
                            </div>

                            {/* Second Row: Signer Name Section */}
                            <div className=" col-12 text-center mb-4">
                                <div className="col-auto pe-2"><label className="form-label fw-semibold text-dark mb-0">
                                    <i className="bi bi-person-circle me-2"></i> Signer Name </label></div>
                                <div className="col-12"><NameInput value={name} onChange={setName}
                                                                   placeholder="Enter your full name"/></div>
                            </div>
                            {/* Third Row: Document Upload Section */}
                            <div className="row mb-5">
                                <div className="text-center col-12"><label
                                    className="form-label fw-semibold text-dark mb-2"> <i
                                    className="bi bi-upload me-2"></i> Upload Document </label></div>
                                <div className="text-center mb-4 "><FileUpload onFileSelected={setSelectedFile}
                                                                               acceptedFormats=".pdf,.doc,.docx"/> {selectedFile && !packageId && (
                                    <div className="d-grid gap-2 mt-3">
                                        <button className="btn btn-europa" onClick={createPackageWithDocument}>
                                            Start Signing Flow
                                        </button>
                                    </div>)} </div>
                            </div>


                            {uploaded && packageId && !signed && (
                                <button
                                    className="btn btn-europa w-100 mt-3"
                                    disabled={!name.trim()}
                                    onClick={openSigningIframe}
                                >
                                    Sign document
                                </button>
                            )}

                            {signed && (
                                <div className="alert alert-success mt-4 text-center">
                                    <p className="fw-semibold mb-2">Document signed successfully</p>
                                    <button className="btn btn-europa" onClick={handleDownload}>
                                        Download signed document
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
