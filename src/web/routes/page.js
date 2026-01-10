const { ENABLE_MAP, ENABLE_THEMES, VISUAL_LIMIT, VERSION } = require("../../config/constants");

const setupPageRoutes = (router, dependencies) => {
    const { htmlTemplate, identity, peerManager, swarm } = dependencies;

    router.get("/", (req, res) => {
        const count = peerManager.size;
        const directPeers = swarm.getSwarm().connections.size;
        const totalUnique = peerManager.totalUniquePeers;

        const html = htmlTemplate
            .replace(/\{\{COUNT\}\}/g, count)
            .replace(/\{\{ID\}\}/g, identity.screenname || "Unknown")
            .replace(/\{\{FULL_ID\}\}/g, identity.id)
            .replace(/\{\{DIRECT\}\}/g, directPeers)
            .replace(/\{\{TOTAL_UNIQUE\}\}/g, totalUnique)
            .replace(/\{\{MAP_CLASS\}\}/g, ENABLE_MAP ? "" : "hidden")
            .replace(/\{\{THEMES_CLASS\}\}/g, ENABLE_THEMES ? "" : "hidden")
            .replace(/\{\{VISUAL_LIMIT\}\}/g, VISUAL_LIMIT)
            .replace(/\{\{VERSION\}\}/g, VERSION);

        res.send(html);
    });
};

module.exports = { setupPageRoutes };
