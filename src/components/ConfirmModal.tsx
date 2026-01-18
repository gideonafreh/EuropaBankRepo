import {useState} from "react";

type Props = {
    signerName: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
};

export function ConfirmModal({ signerName, onConfirm, onCancel }: Props) {
    const [loading, setLoading] = useState(false);

    return (
        <div
            className="modal fade show"
            style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,0.5)",
                zIndex: 1050,
            }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Confirm Signing</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onCancel}
                            disabled={loading}
                        />
                    </div>

                    <div className="modal-body">
                        <p>
                            Are you sure you want to sign this document as
                            <strong> {signerName}</strong>?
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn btn-europa"
                            disabled={loading}
                            onClick={async () => {
                                console.log("Confirm & Sign clicked");
                                setLoading(true);

                                try {
                                    await onConfirm();
                                } catch (err) {
                                    console.error("Signing failed:", err);
                                    alert("Signing failed. Please try again.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            {loading ? "Signing…" : "Confirm & Sign"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
