const https = require("https");

const setupGitHubRoutes = (router, dependencies) => {
    const { repo } = dependencies;

    router.get("/api/github/latest-release", (req, res) => {

        const options = {
            hostname: "api.github.com",
            path: `/repos/${repo.owner}/${repo.name}/releases/latest`,
            method: "GET",
            headers: {
                "User-Agent": "Hypermind-Version-Checker",
            },
        };

        const request = https.request(options, (response) => {
            let data = "";

            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {
                if (response.statusCode === 404) {
                    return res.json({
                        tag_name: null,
                        html_url: null,
                        published_at: null,
                        body: null,
                    });
                }

                if (response.statusCode !== 200) {
                    console.error(
                        "Failed to fetch latest GitHub release:",
                        response.statusCode
                    );
                    return res
                        .status(500)
                        .json({ error: "Failed to fetch latest release" });
                }

                try {
                    const release = JSON.parse(data);
                    res.json({
                        tag_name: release.tag_name,
                        html_url: release.html_url,
                        published_at: release.published_at,
                        body: release.body,
                    });
                } catch (error) {
                    console.error("Error parsing GitHub response:", error);
                    res.status(500).json({ error: "Failed to parse release data" });
                }
            });
        });

        request.on("error", (error) => {
            console.error("Error fetching latest GitHub release:", error);
            res.status(500).json({ error: "Failed to fetch latest release" });
        });

        request.end();
    });
};

module.exports = { setupGitHubRoutes };
