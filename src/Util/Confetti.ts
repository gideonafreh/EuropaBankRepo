import confetti from "canvas-confetti";

export function fireConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    const colors = ["#0d6efd", "#198754", "#ffc107"];

    (function frame() {
        confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
        });

        confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}
