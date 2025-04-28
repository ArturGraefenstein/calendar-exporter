# Calendar Exporter

[![Tests](https://img.shields.io/badge/tests-vitest-blue)](https://vitest.dev/) [![Cloudflare Workers](https://img.shields.io/badge/platform-cloudflare%20workers-yellow)](https://developers.cloudflare.com/workers/)

A Cloudflare Worker to export Google Calendar events as an ICS feed.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Types](#types)
- [Generate a Google Refresh Token](#generate-a-google-refresh-token)
- [Generate a Secret UUID](#generate-a-secret-uuid)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

- Export Google Calendar events as an `.ics` feed
- Secure access via a secret UUID
- Authentication through the Google API
- Use `ical-generator` for ICS creation
- Local development & debugging with `wrangler dev`
- Unit tests with Vitest and Pool-Workers

## Requirements

- Node.js >= 18
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account
- Google Service Account credentials (JSON)

## Installation

```bash
git clone https://github.com/ArturGraefenstein/calendar-exporter.git
cd calendar-exporter
npm install
```

## Configuration

1. Copy the example calendar config:
   ```bash
   cp src/calendar-config.ts.example src/calendar-config.ts
   ```
2. Add your calendar IDs in `src/calendar-config.ts`.

## Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required variables in `.env`:

   - `CLIENT_ID`: your Google Cloud App client ID
   - `CLIENT_SECRET`: your Google Cloud App client secret

## Types

1. Copy the example dev vars file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. You don’t need to change anything here unless you plan to test locally.
3. Generate Wrangler types:
   ```bash
   npm run typegen
   ```

## Generate a Google Refresh Token

1. Run the token generation script:
   ```bash
   npm run generate-token
   ```
2. Follow the prompts and authorize the target Google account to access your calendar.
3. Copy the token from the URL parameter `code` and paste it back into the terminal.
4. The token will be exported to Cloudflare. For local development, add the JSON to your `.dev.vars` file.

## Generate a Secret UUID

1. Run the UUID generation script:
   ```bash
   npm run generate-uuid
   ```
2. The UUID will be exported to Cloudflare. For local development, add the UUID to your `.dev.vars` file.

## Deployment

Deploy with Wrangler:

```bash
npm run deploy
```

## Contributing

Contributions are welcome! Please open an issue first.
