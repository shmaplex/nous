<p align="center">
  <img src=".github/github-header.png" alt="Nous Logo" width="full"/>
</p>

# Nous App

> a decentralized news aggregator and analysis tool built with **Wails + React**, **Helia (IPFS)**, and **OrbitDB**. The app allows users to fetch, save, and sync news articles in a peer-to-peer network while providing transparency and analytics on article sources, bias, and sentiment.

---

## Table of Contents

1. [About](#about)
2. [Features](#features)
3. [Live Development](#live-development)
4. [Building](#building)
5. [Usage](#usage)
6. [Contribution Guidelines](#contribution-guidelines)
7. [Feature Roadmap](#feature-roadmap)

---

## About

Nous is designed to explore decentralized news storage and retrieval. Articles are saved locally and synced across peers using IPFS and OrbitDB. The frontend provides filtering by political bias, location, and edition, along with real-time status of the P2P network and syncing activity.

The app also includes:

- A dynamic **status bar** showing connection and syncing status
- A centralized **logo** for branding
- Custom **filters and settings panel**
- Article **add/edit/delete** functionality
- Integration with Go backend via **Wails**

For more on Wails project configuration, see: [Wails Project Config](https://wails.io/docs/reference/project-config)

---

## Features

- [x] P2P news storage with Helia + OrbitDB
- [ ] Article CRUD: create, read, delete articles
- [x] Article filtering by bias, edition, and location
- [x] Status bar with connection and syncing indicators
- [x] Lucide icons for professional UI feedback
- [x] Centralized logo in header
- [x] Settings panel and location selector
- [ ] Article analytics: sentiment, bias, antithesis, philosophical insights (planned)
- [ ] IPFS replication across multiple peers (planned)
- [ ] User authentication for multi-user support (planned)
- [ ] Notifications for new articles or sync completion (planned)

---

## Live Development

You can quickly start developing the app with Wails:

1. **Install dependencies**

   **Frontend:**
   cd frontend
   npm install

   **Backend:**
   cd ../backend
   go mod tidy

2. **Run the app in development mode**
   wails dev

This will start both the Go backend and React frontend with live reloading.

For more info about Wails, see: [Wails Docs](https://wails.io/)

---

## Building

To build the production version of the app:

    wails build

This will generate a standalone executable for your platform.

---

## Usage

Once built or running via `wails dev`, you can:

- Add, edit, and delete articles
- Filter articles by bias, edition, and location
- Monitor the P2P network and syncing status
- Customize settings and location preferences

---

## Contribution Guidelines

Welcome contributors! Here's how to get started:

1. Fork the repository and clone it locally
2. Install dependencies (see [Live Development](#live-development))
3. Explore the `scripts/` folder for helpful utilities and automation scripts
4. Run the app locally using `wails dev`
5. Open a pull request with your changes and include descriptive commit messages

Contributions are encouraged in:

- Core functionality and P2P networking
- Frontend enhancements (React + Tailwind CSS)
- Utility scripts in `scripts/`
- Bug fixes and documentation improvements

Please follow conventional commits for consistency: [Conventional Commits](https://www.conventionalcommits.org/)

---

## Feature Roadmap

- Real-time IPFS replication across multiple peers
- Advanced article analytics: sentiment, cognitive bias, philosophical insights
- Multi-user authentication and profiles
- Notification system for new articles or sync updates
- Mobile-friendly interface and offline support
- Improved filter customization and search functionality

---

Happy contributing! 🚀
