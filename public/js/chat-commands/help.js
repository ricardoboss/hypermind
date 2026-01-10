export const helpCommand = {
    description: "Shows available commands",
    execute: () => {
        const output = document.getElementById("terminal-output");
        if (!output) return;

        const createHelpSection = (title, items) => {
            const section = document.createElement("div");
            section.style.marginBottom = "10px";
            section.style.color = "#aaa";

            const header = document.createElement("div");
            header.style.fontWeight = "bold";
            header.style.color = "#fff";
            header.style.marginBottom = "4px";
            header.innerText = title;
            section.appendChild(header);

            items.forEach((item) => {
                const div = document.createElement("div");
                div.innerHTML = `<span style="color: #4ade80">${item.cmd}</span> - ${item.desc}`;
                section.appendChild(div);
            });

            return section;
        };

        const helpContainer = document.createElement("div");
        helpContainer.className = "system-message";
        helpContainer.style.padding = "10px";
        helpContainer.style.borderTop = "1px dashed #333";
        helpContainer.style.borderBottom = "1px dashed #333";
        helpContainer.style.margin = "10px 0";

        // system
        const systemCmds = [
            {
                cmd: "/whisper &lt;user&gt; &lt;msg&gt;",
                desc: "Send a private message",
            },
            { cmd: "/block &lt;user&gt;", desc: "Block messages from a user" },
            { cmd: "/unblock &lt;user&gt;", desc: "Unblock a user" },
            {
                cmd: "/local &lt;msg&gt;",
                desc: "Send message to direct peers only (Global by default)",
            },
            { cmd: "/clear", desc: "Clear chat history" },
            { cmd: "/help", desc: "Show this help menu" },
        ];
        helpContainer.appendChild(
            createHelpSection("System Commands", systemCmds)
        );

        // Formatting
        const formatCmds = [
            { cmd: "**text**", desc: "Bold" },
            { cmd: "*text*", desc: "Italics" },
            { cmd: "__text__", desc: "Underline" },
            { cmd: "~~text~~", desc: "Strikethrough" },
            { cmd: "`text`", desc: "Code" },
        ];
        helpContainer.appendChild(createHelpSection("Formatting", formatCmds));

        // Easter Eggs
        const eggs = Object.entries(window.ChatCommands.replacements).map(
            ([k, v]) => ({
                cmd: k,
                desc: v,
            })
        );
        helpContainer.appendChild(createHelpSection("Easter Eggs", eggs));

        output.appendChild(helpContainer);
        output.scrollTop = output.scrollHeight;
    },
};
