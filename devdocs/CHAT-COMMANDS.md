# Chat Commands

Chat commands are modular and located in `public/js/chat-commands/`.

## Adding a Command

1. Create `chat-commands/mycommand.js`:
```javascript
export const myCommand = {
  description: "What it does",
  execute: () => {
    const output = document.getElementById("terminal-output");
    // implementation
  },
};
```

2. Import and register in `commands.js`:
```javascript
import { myCommand } from "./chat-commands/mycommand.js";

const actions = {
  // ... existing commands
  "/mycommand": myCommand,
};