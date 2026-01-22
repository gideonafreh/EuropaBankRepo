import ebLogo from "../assets/pngwing.png";
type Props = {
    iframeUrl: string;
    onClose: () => void;
};

export function SigningIframeModal({ iframeUrl, onClose }: Props) {
    return (
        <div
            className="modal fade show"
            style={{
                display: "block",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
                zIndex: 1050,
            }}
        >
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div
                    className="modal-content"
                    style={{
                        height: "90vh",
                        borderRadius: "18px",
                        overflow: "hidden",
                        border: "none",
                        boxShadow:
                            "0 20px 40px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.15)",
                    }}
                >
                    {/* Header */}
                    <div
                        className="modal-header"
                        style={{
                            background: "linear-gradient(135deg, #0d6efd, #084298)",
                            padding: "1rem 1.5rem",
                            borderBottom: "none",
                            position: "relative",
                            minHeight: "80px",
                        }}
                    >
                        {/* Centered EB logo */}
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <img
                                src={ebLogo}
                                alt="Europabank"
                                style={{
                                    height: "80px",
                                    objectFit: "contain",
                                }}
                            />
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            style={{
                                marginLeft: "auto",
                                background: "rgba(255,255,255,0.2)",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "1.2rem",
                                cursor: "pointer",
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <div
                        className="modal-body p-0"
                        style={{
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <iframe
                            src={iframeUrl}
                            title="SigningHub"
                            width="100%"
                            height="100%"
                            style={{
                                border: "none",
                                backgroundColor: "#fff",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
