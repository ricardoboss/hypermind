export const clearCommand = {
    description: "Clears the chat history",
    execute: () => {
        const output = document.getElementById("terminal-output");
        if (output) output.innerHTML = "";
    },
};
