# lazy-office-server

A tiny proxy server that lets the GitHub Pages UI send commands to an OpenClaw Gateway.

## Why do we need this?
GitHub Pages is static and cannot safely store your OpenClaw gateway token.
This server holds the token and forwards requests to the Gateway.

## Run locally

```bash
cd server
npm i

# Gateway is remote but bound to localhost? Use an SSH tunnel first:
# ssh -N -L 18789:127.0.0.1:18789 user@your-host

export OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
export OPENCLAW_GATEWAY_TOKEN=...   # your gateway token
export CORS_ORIGIN=https://ssc1223.github.io

npm start
# server listens on http://127.0.0.1:8787
```

Then, in the web UI (Command panel), set API Base URL to:

- `http://127.0.0.1:8787`

## Notes
- `/api/command` uses the Gateway `POST /tools/invoke` endpoint.
- By default it calls the `sessions_spawn` tool (runs a sub-agent task).
- Adjust `agentIdMap` to map the UI names to your OpenClaw agent IDs.
