const express = require("express");
const path = require("path");

/**
 * Routes should always be imported here and created in the ./routes folder.
 * Please let's all make sure we follow coding standards so things don't get too messy.
 */
const { setupStatsRoutes } = require("./routes/stats");
const { setupChatRoutes } = require("./routes/chat");
const { setupGitHubRoutes } = require("./routes/github");
const { setupUtilityRoutes } = require("./routes/utility");
const { setupPageRoutes } = require("./routes/page");
const { setupSSERoutes } = require("./routes/sse");

const setupRoutes = (
  app,
  identity,
  peerManager,
  swarm,
  sseManager,
  diagnostics
) => {
  app.use(express.json());

  const utilityDeps = {
    adjectives: require("../config/constants").ADJECTIVES,
    nouns: require("../config/constants").NOUNS,
    generatorLogic: require("../config/constants").GENERATOR_LOGIC,
  };

  const pageDeps = {
    htmlTemplate: require("../config/constants").HTML_TEMPLATE,
    identity,
    peerManager,
    swarm,
  };

  const sseDeps = {
    identity,
    peerManager,
    swarm,
    sseManager,
    diagnostics,
  };

  const statsDeps = {
    identity,
    peerManager,
    swarm,
    diagnostics,
  };

  const chatDeps = {
    identity,
    swarm,
    sseManager,
  };

  const githubDeps = {
    repo: require("../config/constants").GITHUB_REPO,
  };

  setupUtilityRoutes(app, utilityDeps);
  setupPageRoutes(app, pageDeps);
  setupSSERoutes(app, sseDeps);
  setupStatsRoutes(app, statsDeps);
  setupChatRoutes(app, chatDeps);
  setupGitHubRoutes(app, githubDeps);

  app.use(express.static(path.join(__dirname, "../../public")));
};

module.exports = { setupRoutes };
