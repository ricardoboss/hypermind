const http = require("http");

const test = (method, path, body = null, validate, timeout = 5000) => {
    return new Promise((resolve) => {
        const options = {
            hostname: "localhost",
            port: 3000,
            path,
            method,
            headers: body ? { "Content-Type": "application/json" } : {},
        };

        let resolved = false;
        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`✗ ${method} ${path} - Timeout`);
                resolve(false);
            }
        }, timeout);

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
                if (path === "/events" && data.includes("data:")) {
                    clearTimeout(timer);
                    if (!resolved) {
                        resolved = true;
                        const valid = validate(data, res.headers["content-type"]);
                        console.log(`${valid ? "✓" : "✗"} ${method} ${path}`);
                        req.destroy();
                        resolve(valid);
                    }
                }
            });
            res.on("end", () => {
                clearTimeout(timer);
                if (!resolved) {
                    resolved = true;
                    try {
                        const valid = validate(data, res.headers["content-type"]);
                        console.log(`${valid ? "✓" : "✗"} ${method} ${path}`);
                        resolve(valid);
                    } catch (e) {
                        console.log(`✗ ${method} ${path} - ${e.message}`);
                        resolve(false);
                    }
                }
            });
        });

        req.on("error", (e) => {
            clearTimeout(timer);
            if (!resolved) {
                resolved = true;
                console.log(`✗ ${method} ${path} - ${e.message}`);
                resolve(false);
            }
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

(async () => {
    console.log("Testing API endpoints...\n");

    const results = await Promise.all([
        test("GET", "/api/stats", null, (data) => {
            const json = JSON.parse(data);
            return json.count !== undefined && json.id && json.screenname && json.diagnostics;
        }),
        test("GET", "/api/github/latest-release", null, (data) => {
            const json = JSON.parse(data);
            return json.tag_name && json.html_url;
        }),
        test("POST", "/api/chat", { content: "test", scope: "LOCAL" }, (data) => {
            const json = JSON.parse(data);
            return json.success === true;
        }),
        test("GET", "/events", null, (data, contentType) => {
            return contentType.includes("text/event-stream") && data.includes("data:");
        }, 2000),
        test("GET", "/js/lists.js", null, (data, contentType) => {
            return contentType.includes("javascript") && data.includes("ADJECTIVES") && data.includes("NOUNS");
        }),
        test("GET", "/js/screenname.js", null, (data, contentType) => {
            return contentType.includes("javascript") && data.includes("generateScreenname");
        }),
        test("GET", "/", null, (data, contentType) => {
            return contentType.includes("text/html") && data.includes("Hypermind");
        }),
    ]);

    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log(`\n${passed}/${total} tests passed`);
    process.exit(passed === total ? 0 : 1);
})();
