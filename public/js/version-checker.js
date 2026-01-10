const CACHE_KEY = "hypermind-version-check";
const CACHE_DURATION = 86400000;

const getCurrentVersion = () => {
    return document.body.dataset.version || "no-version";
};

const checkForNewVersion = async () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsedCache = JSON.parse(cached);
                const now = Date.now();

                if (now - parsedCache.timestamp < CACHE_DURATION) {
                    if (parsedCache.data) {
                        showVersionNotification(parsedCache.data);
                    }
                    return;
                }
            } catch (e) {
                localStorage.removeItem(CACHE_KEY);
            }
        }

        const response = await fetch("/api/github/latest-release");
        if (!response.ok) return;

        const release = await response.json();

        const cacheData = {
            data: release,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        showVersionNotification(release);
    } catch (error) {
        console.error("Error checking for new version:", error);
    }
};

const showVersionNotification = (release) => {
    if (!release || !release.tag_name) return;

    const latestVersion = release.tag_name.replace(/^v/, "");
    const currentVersion = getCurrentVersion();

    if (latestVersion === currentVersion) return;

    const dismissedKey = `hypermind-version-dismissed-${release.tag_name}`;
    if (localStorage.getItem(dismissedKey) === "true") return;

    const banner = document.getElementById("version-notification");
    if (!banner) return;

    const versionText = banner.querySelector(".version-text");
    const updateLink = banner.querySelector(".update-link");
    const dismissBtn = banner.querySelector(".dismiss-btn");

    versionText.textContent = `New version ${release.tag_name} available!`;
    updateLink.href = release.html_url;

    dismissBtn.onclick = () => {
        banner.classList.remove("active");
        localStorage.setItem(dismissedKey, "true");
    };

    setTimeout(() => {
        banner.classList.add("active");
    }, 1000);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkForNewVersion);
} else {
    checkForNewVersion();
}
