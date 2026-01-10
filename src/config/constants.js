const crypto = require("crypto");

const TOPIC_NAME = process.env.TOPIC_NAME || "hypermind-lklynet-v1";
const TOPIC = crypto.createHash("sha256").update(TOPIC_NAME).digest();

const MY_POW_PREFIX = "00000";
const VERIFICATION_POW_PREFIX = "0000";

const MAX_PEERS = parseInt(process.env.MAX_PEERS) || 50000;
const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE) || 2048;
const MAX_RELAY_HOPS = parseInt(process.env.MAX_RELAY_HOPS) || 5;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 15;

const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL) || 30000;
const CONNECTION_ROTATION_INTERVAL =
  parseInt(process.env.CONNECTION_ROTATION_INTERVAL) || 300000;
const PEER_TIMEOUT = parseInt(process.env.PEER_TIMEOUT) || 45000;
const BROADCAST_THROTTLE = 1000;
const DIAGNOSTICS_INTERVAL = 10000;
const PORT = process.env.PORT || 3000;
const fs = require("fs");
const path = require("path");

const ENABLE_CHAT = process.env.ENABLE_CHAT === "true";
const ENABLE_MAP = process.env.ENABLE_MAP === "true";
const ENABLE_THEMES = process.env.ENABLE_THEMES !== "false";
const VISUAL_LIMIT = parseInt(process.env.VISUAL_LIMIT) || 500;
const CHAT_RATE_LIMIT = parseInt(process.env.CHAT_RATE_LIMIT) || 5000;

const HTML_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../../public/index.html"),
  "utf-8"
);

const ADJECTIVES = fs.readFileSync(
  path.join(__dirname, "../utils/adjectives.json"),
  "utf-8"
);

const NOUNS = fs.readFileSync(
  path.join(__dirname, "../utils/nouns.json"),
  "utf-8"
);

const GENERATOR_LOGIC = fs.readFileSync(
  path.join(__dirname, "../utils/name-generator.js"),
  "utf-8"
);

const packageJson = require("../../package.json");
const repoUrl = packageJson.repository?.url || "";
const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
const GITHUB_REPO = repoMatch
  ? { owner: repoMatch[1], name: repoMatch[2] }
  : { owner: "lklynet|test", name: "hypermind|test" };

const VERSION = packageJson.version || "no-version";

module.exports = {
  TOPIC_NAME,
  TOPIC,
  MY_POW_PREFIX,
  VERIFICATION_POW_PREFIX,
  MAX_PEERS,
  MAX_MESSAGE_SIZE,
  MAX_RELAY_HOPS,
  MAX_CONNECTIONS,
  HEARTBEAT_INTERVAL,
  CONNECTION_ROTATION_INTERVAL,
  PEER_TIMEOUT,
  BROADCAST_THROTTLE,
  DIAGNOSTICS_INTERVAL,
  PORT,
  ENABLE_CHAT,
  ENABLE_MAP,
  ENABLE_THEMES,
  CHAT_RATE_LIMIT,
  VISUAL_LIMIT,
  HTML_TEMPLATE,
  ADJECTIVES,
  NOUNS,
  GENERATOR_LOGIC,
  GITHUB_REPO,
  VERSION,
};
