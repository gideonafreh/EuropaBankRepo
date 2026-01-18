import {useState} from "react";
import {NameInput} from "../components/NameInput";
import {FileUpload} from "../components/FileUpload";
// import {SignButton} from "../components/SignButton";
import {ConfirmModal} from "../components/ConfirmModal";
import {signDocument } from "../api/signingHubClient";
import { uploadFile } from "../api/signingHubClient";
import { downloadSignedPackage } from "../api/signingHubClient";
import logo from "../assets/pngwing.png";
import europaBg from "../assets/vecteezy_yellow-blue-black-gradient-background_10547429.jpg";
import { LoadingOverlay } from "../components/LoadingOverlay";

export function Home() {
    const [name, setName] = useState("");
    const [packageId, setPackageId] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [confirm, setConfirm] = useState(false);
    const [signed, setSigned] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploaded, setUploaded] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDownload() {
        if (!packageId) return;

        console.log("Downloading signed package:", packageId);
        try {
            setLoading(true);
            await downloadSignedPackage(Number(packageId));
        } finally {
            setLoading(false);
        }
        // ⬇️ THIS IS AN ARRAYBUFFER
        const buffer = await downloadSignedPackage(Number(packageId));

        console.log("=== ARRAYBUFFER RECEIVED ===");
        console.log("Byte length:", buffer.byteLength);

        // Create PDF blob
        const blob = new Blob(
            [buffer],
            { type: "application/pdf" }
        );
        console.log(new Uint8Array(buffer).slice(0, 8));
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `signed-package-${packageId}.pdf`;
        a.click();

        URL.revokeObjectURL(url);

        console.log("✅ PDF download triggered");


    }




    async function confirmSign() {
        console.log("confirmSign() called");

        if (!packageId || !documentId) {
            console.error("Missing packageId or documentId");
            return;
        }

        console.log("Signing document:", {
            packageId,
            documentId,
            signer: name,
        });

        await signDocument(packageId, documentId, name);

        setSigned(true);
        setConfirm(false);
    }
    async function createPackageWithDocument() {
        if (!selectedFile) return;

        try {
            setLoading(true);

            const response = await uploadFile(selectedFile);

            setPackageId(response.packageId);
            setDocumentId(response.documentId);
            setUploaded(true);
        } finally {
            setLoading(false);
        }
    }
    console.log({
        uploaded,
        packageId,
        documentId,
        signed,
    });

    return (

        <>
            <LoadingOverlay
                visible={loading}
                message="Processing document…"
            />

            <div
                className="container-fluid justify-content-center align-items-center"
                style={{
                    // minHeight: "100vh",
                    backgroundImage: `url(${europaBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >




            {/* Background gradient overlay */}

            <div className="row min-vh-100 justify-content-center align-items-center">
                <div className="col-11 col-sm-8 col-md-6 col-lg-4">
                    <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5 europa-card">


                    {/* First Row: Header Section */}
                        <div className="text-center mb-4">
                            <img
                                src={logo}
                                alt="Europa Bank Logo"
                                style={{ maxWidth: "300px" }}

                            />
                            <h2 className="h6 text-muted fw-normal">
                                Document Integration Portal
                            </h2>
                        </div>

                        {/* Second Row: Signer Name Section */}
                        <div className=" col-12 text-center mb-4">
                            <div className="col-auto pe-2">
                                <label className="form-label fw-semibold text-dark mb-0">
                                    <i className="bi bi-person-circle me-2"></i>
                                    Signer Name
                                </label>
                            </div>

                            <div className="col-12">
                                <NameInput
                                    value={name}
                                    onChange={setName}
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>


                        {/* Third Row: Document Upload Section */}
                        <div className="row mb-5">

                            <div className="text-center col-12">
                                <label className="form-label fw-semibold text-dark mb-2">
                                    <i className="bi bi-upload me-2"></i>
                                    Upload Document
                                </label>
                            </div>

                            <div className="text-center mb-4 ">
                                <FileUpload
                                    onFileSelected={setSelectedFile}
                                    acceptedFormats=".pdf,.doc,.docx"
                                />
                                {selectedFile && !packageId && (
                                    <div className="d-grid gap-2 mt-3">
                                        <button
                                            className="btn btn-europa"
                                            onClick={createPackageWithDocument}
                                        >
                                            Create Package
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Fourth Row: Action Buttons */}
                        <div className="row">
                            <div className="col-12">
                                {uploaded && packageId && !signed && (
                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-europa"
                                            disabled={!name.trim()}
                                            onClick={() => setConfirm(true)}
                                        >
                                            <i className="bi bi-pen me-2"></i>
                                            Sign document
                                        </button>

                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setName("");
                                                setDocumentId(null);
                                                setPackageId(null);
                                                setUploaded(false);
                                                setSigned(false);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            <i className="bi bi-arrow-clockwise me-2"></i>
                                            Reset Form
                                        </button>
                                    </div>
                                )}

                                {/* Success Message */}
                                {signed && (
                                    <div className="alert alert-success border-0 rounded-3 mt-4 text-center py-3">
                                        <div className="align-items-center justify-content-center">
                                            <i className="bi bi-check-circle-fill fs-4 me-2"></i>
                                            <span className="fw-semibold">
                        Document signed successfully!
                    </span>
                                        </div>
                                        <p className="mb-0 mt-2 text-muted">
                                            Your document has been securely processed.
                                        </p>
                                        <button
                                            className="btn btn-europa mt-3"
                                            onClick={handleDownload}
                                        >
                                            <i className="bi bi-download me-2"></i>
                                            Download signed document
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-success mt-3"
                                            onClick={() => {
                                                setName("");
                                                setDocumentId(null);
                                                setPackageId(null);
                                                setUploaded(false);
                                                setSigned(false);
                                                setSelectedFile(null);
                                            }}
                                        >
                                            Sign Another Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Row */}
                    <div className="row mt-4">
                        <div className="col-12 text-center">
                            <p className="text-white small">
                                <i className="bi bi-shield-check me-1"></i>
                                Secured by Zeticon Digital Signing
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modal */}
            {confirm && (
                <ConfirmModal
                    onConfirm={confirmSign}
                    onCancel={() => setConfirm(false)}
                    signerName={name}
                />
            )}
        </div>

        </>
    );
}