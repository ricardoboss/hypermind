export const frenzyCommand = {
    description: "Rotates all themes for 20 seconds",
    execute: () => {
        const output = document.getElementById("terminal-output");
        if (!output) return;

        if (typeof window.cycleTheme !== "function") {
            const errorDiv = document.createElement("div");
            errorDiv.className = "system-message";
            errorDiv.style.color = "#ff6b6b";
            errorDiv.innerText = "[SYSTEM] Theme frenzy unavailable";
            output.appendChild(errorDiv);
            output.scrollTop = output.scrollHeight;
            return;
        }

        const startDiv = document.createElement("div");
        startDiv.className = "system-message";
        startDiv.style.color = "#4ade80";
        startDiv.innerText = "[SYSTEM] Hold onto your trousers!!!";
        output.appendChild(startDiv);
        output.scrollTop = output.scrollHeight;

        let count = 0;
        const maxRotations = 100;

        const frenzyInterval = setInterval(() => {
            window.cycleTheme();
            count++;

            if (count >= maxRotations) {
                clearInterval(frenzyInterval);

                const endDiv = document.createElement("div");
                endDiv.className = "system-message";
                endDiv.style.color = "#4ade80";
                endDiv.innerText = "[SYSTEM] You survived the storm!";
                output.appendChild(endDiv);
                output.scrollTop = output.scrollHeight;
            }
        }, 100);
    },
};
