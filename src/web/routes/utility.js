const setupUtilityRoutes = (router, dependencies) => {
    const { adjectives, nouns, generatorLogic } = dependencies;

    router.get("/js/lists.js", (req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.send(`window.ADJECTIVES = ${adjectives}; window.NOUNS = ${nouns};`);
    });

    router.get("/js/screenname.js", (req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        const browserLogic = generatorLogic
            .replace(
                'const adjectives = require("./adjectives.json");',
                "const adjectives = window.ADJECTIVES;"
            )
            .replace(
                'const nouns = require("./nouns.json");',
                "const nouns = window.NOUNS;"
            )
            .replace(
                "module.exports = { generateScreenname };",
                "window.generateScreenname = generateScreenname;"
            );
        res.send(browserLogic);
    });
};

module.exports = { setupUtilityRoutes };
