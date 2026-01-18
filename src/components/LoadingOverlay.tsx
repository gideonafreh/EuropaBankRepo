import "../LoadingOverlay.css";
import loader from "../assets/signing_yellow_clean.gif";

type Props = {
    visible: boolean;
    message?: string;
};

export function LoadingOverlay({ visible, message }: Props) {
    if (!visible) return null;

    return (
        <div className="loading-overlay">
            <img src={loader} alt="Loading..." />
            {message && <p>{message}</p>}
        </div>
    );
}
