const crypto = require("crypto");
const { signMessage } = require("../../core/security");
const { ENABLE_CHAT, CHAT_RATE_LIMIT } = require("../../config/constants");

const setupChatRoutes = (router, dependencies) => {
    const { identity, swarm, sseManager } = dependencies;
    let chatHistory = [];

    router.post("/api/chat", (req, res) => {
        if (!ENABLE_CHAT) {
            return res.status(403).json({ error: "Chat disabled" });
        }

        const now = Date.now();
        chatHistory = chatHistory.filter((time) => now - time < CHAT_RATE_LIMIT);

        if (chatHistory.length >= 5) {
            return res.status(429).json({
                error: `Rate limit exceeded: Max 5 messages per ${CHAT_RATE_LIMIT / 1000
                    } seconds`,
            });
        }

        chatHistory.push(now);

        const { content, scope = "GLOBAL", target } = req.body;
        if (!content || typeof content !== "string" || content.length > 140) {
            return res.status(400).json({ error: "Invalid content" });
        }

        if (scope !== "LOCAL" && scope !== "GLOBAL") {
            return res.status(400).json({ error: "Invalid scope" });
        }

        const timestamp = Date.now();
        const idBase = identity.id + content + timestamp;
        const msgId = crypto.createHash("sha256").update(idBase).digest("hex");

        const msg = {
            type: "CHAT",
            id: msgId,
            sender: identity.id,
            content: content,
            timestamp: timestamp,
            scope: scope,
            target: target,
            hops: 0,
        };

        if (scope === "GLOBAL") {
            msg.sig = signMessage(`chat:${msgId}`, identity.privateKey);
        }

        swarm.broadcastChat(msg);
        sseManager.broadcast(msg);

        res.json({ success: true });
    });
};

module.exports = { setupChatRoutes };
