# zaloclaw-ui

ZaloClaw UI is a setup companion for running OpenClaw with Zalo smoothly on your local machine.

Its primary purpose is to make OpenClaw onboarding easier and less error-prone for Zalo users.

![Welcome screen](assets/welcome.png)

## Project Purpose

This project helps users quickly configure and operate a Zalo-powered OpenClaw assistant, with guided flows for common setup tasks.

## What This Project Helps You Set Up

- Configure Zalo bot token and related connection settings.
- Pair and manage gateway or local devices used by the assistant.
- Set up browser automation workflows for assisted tasks.
- Enable local search and retrieval through browser-based capabilities.

## Goal

Reduce setup friction so users can move from initial installation to a working Zalo + OpenClaw assistant with minimal manual configuration.

## Setup

Start the app locally with one command:

```bash
npm run dev
```

Then open the local URL shown in terminal (usually `http://localhost:3000`) and follow the onboarding flow.

## Onboarding Walkthrough

### 1. Welcome

Use the welcome screen to start the guided onboarding flow.

### 2. OpenClaw Config Check

Verify that OpenClaw is reachable and healthy before moving forward:

- Confirm gateway config is loaded (assistant name and server version).
- Check websocket connection status.
- Add or update your gateway token if needed.
- (Optional) Expand advanced fields for device ID / keys / device token.
- Save config, then continue when connection status is ready.

### 3. Model Selection

Select the model OpenClaw should use by default:

- Load available model options from current config.
- Choose a primary model.
- Save your selection to persist it into configuration.
- Continue to Zalo setup.

### 4. Zalo Config & Pairing

Complete Zalo integration and pairing:

- Check channel status and wait for auto-refresh.
- Add and save your Zalo bot token.
- Paste pairing guide text and execute the approve command.
- Confirm paired status, then proceed to completion.

![Zalo setup screen](assets/zalo.png)

### 5. Complete

Finish onboarding and enter the dashboard with OpenClaw + Zalo ready.

## Author

**Hưng Nguyễn** — Đam mê AI, thích tự động hóa và đơn giản mọi thứ.
