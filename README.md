# Nous App

<p align="center">
  <img src="frontend/src/assets/images/logo-universal.png" alt="Nous Logo" width="150"/>
</p>

**Nous** is a decentralized news aggregator and analysis tool built with **Wails + React**, **Helia (IPFS)**, and **OrbitDB**. The app allows users to fetch, save, and sync news articles in a peer-to-peer network while providing transparency and analytics on article sources, bias, and sentiment.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Live Development](#live-development)
- [Building](#building)
- [Usage](#usage)
- [Contribution Guidelines](#contribution-guidelines)
- [Feature Roadmap](#feature-roadmap)

---

## About

Nous is designed to explore decentralized news storage and retrieval. Articles are saved locally and synced across peers using IPFS and OrbitDB. The frontend provides filtering by political bias, location, and edition, along with real-time status of the P2P network and syncing activity.

The app also includes:

- A dynamic **status bar** showing connection and syncing status
- A **centralized logo** for branding
- Custom **filters and settings panel**
- Article add/edit/delete functionality
- Integration with Go backend via **Wails**

For more on Wails project configuration, see [Wails Project Config](https://wails.io/docs/reference/project-config).

---

## Features

- [x] P2P news storage with Helia + OrbitDB
- [x] Article CRUD: create, read, delete articles
- [x] Article filtering by bias, edition, and location
- [x] Status bar with connection and syncing indicators
- [x] Lucide icons for professional UI feedback
- [x] Centralized logo in header
- [x] Settings panel and location selector
- [ ] Article analytics: sentiment, bias, antithesis, philosophical insights
- [ ] IPFS replication across multiple peers
- [ ] User authentication for multi-user support
- [ ] Notifications for new articles or sync completion

---

## Live Development

1. **Install dependencies**

```bash
cd frontend
npm install
cd ../backend
go mod tidy
```
