/**
 * If you are a developer, import all commands individually here.
 * This way the chat can scale and improve over time without making it a mess
 */
import { clearCommand } from "./chat-commands/clear.js";
import { frenzyCommand } from "./chat-commands/frenzy.js";
import { helpCommand } from "./chat-commands/help.js";
import { replacements } from "./chat-commands/replacements.js";

const formatMessage = (text) => {
  if (!text) return "";

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/__(.*?)__/g, "<u>$1</u>");
  html = html.replace(/~~(.*?)~~/g, "<del>$1</del>");
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");

  return html;
};

const actions = {
  "/clear": clearCommand,
  "/frenzy": frenzyCommand,
  "/help": helpCommand,
};

const processInput = (input) => {
  if (actions[input]) {
    return { type: "action", command: input };
  }

  let processed = input;
  for (const [cmd, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(cmd, "g");
    processed = processed.replace(regex, replacement);
  }

  return { type: "text", content: processed };
};

const ChatCommands = {
  actions,
  replacements,
  processInput,
  formatMessage,
};

window.ChatCommands = ChatCommands;
