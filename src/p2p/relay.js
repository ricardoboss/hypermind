const relayMessage = (msg, sourceSocket, swarm, diagnostics) => {
  const data = JSON.stringify(msg) + "\n";

  // Gossip Subsampling:
  // Instead of flooding everyone (which causes massive bandwidth usage with 50 connections),
  // we relay to a random subset of peers (e.g., 6).
  // This maintains "Epidemic" reach (O(log N)) while capping bandwidth.

  const TARGET_GOSSIP_COUNT = 6;
  const allSockets = Array.from(swarm.connections);
  const eligible = allSockets.filter((s) => s !== sourceSocket);

  let targets = eligible;

  if (eligible.length > TARGET_GOSSIP_COUNT) {
    // Fisher-Yates shuffle (partial) to pick random peers
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    targets = eligible.slice(0, TARGET_GOSSIP_COUNT);
  }

  if (diagnostics) {
    diagnostics.increment("bytesRelayed", data.length * targets.length);
  }

  for (const socket of targets) {
    socket.write(data);
  }
};

module.exports = { relayMessage };
