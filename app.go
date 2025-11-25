package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strconv"
)

type App struct {
	ctx      context.Context
	p2pCmd   *exec.Cmd
	Location string
}

var ORBITDB_KEYSTORE_PATH = "frontend/orbitdb-keystore"
var ORBITDB_DB_PATH = "frontend/orbitdb-databases"

var instanceID int
var NODE_ID string = "nous-node-1"
var httpPortBase int = 9001
var libp2pPortBase int = 4001
var keystorePath string = ORBITDB_KEYSTORE_PATH
var dbPath string = ORBITDB_DB_PATH

var BASE_API_URL string = "http://localhost"

// NewApp creates a new App instance
func NewApp() *App {
	if idStr := os.Getenv("INSTANCE_ID"); idStr != "" {
		if id, err := strconv.Atoi(idStr); err == nil {
			instanceID = id
		}
	}
	return &App{}
}

// Startup initializes the Wails app
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("Nous App started")

	CleanOrbitDBLocks()

	// HTTP port per instance
	if portStr := os.Getenv("HTTP_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			httpPortBase = p
		}
	}

	// Libp2p port per instance
	if portStr := os.Getenv("LIBP2P_PORT"); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			libp2pPortBase = p
		}
	}

	if path := os.Getenv("KEYSTORE_PATH"); path != "" {
		keystorePath = path
	}
	if path := os.Getenv("DB_PATH"); path != "" {
		dbPath = path
	}
	if envID := os.Getenv("NODE_ID"); envID != "" {
		NODE_ID = envID
	}

	log.Printf("[Startup] Using config → http:%d libp2p:%d db:%s keystore:%s",
		httpPortBase+instanceID, libp2pPortBase+instanceID, dbPath, keystorePath)

	// Start P2P node asynchronously
	go func() {
		if err := a.StartP2PNode(); err != "" {
			log.Println("[P2P] Failed to start node:", err)
		} else {
			log.Println("[P2P] Node started successfully")
		}
	}()
}

// Fired before the application is closed
func (a *App) BeforeClose(ctx context.Context) (prevent bool) {
	a.StopP2PNode()     // stop P2P node cleanly
	CleanOrbitDBLocks() // remove leftover LOCK files
	return false        // false = allow close
}

// SetLocation stores user location locally
func (a *App) SetLocation(loc string) string {
	a.Location = loc
	return fmt.Sprintf("Location set to: %s", loc)
}

// GetLocation retrieves current location
func (a *App) GetLocation() string {
	if a.Location == "" {
		return ""
	}
	return a.Location
}

// Base URL for talking to the internal P2P HTTP API
func GetNodeBaseUrl() string {
	return fmt.Sprintf("%s:%d", BASE_API_URL, instanceHTTPPort())
}
