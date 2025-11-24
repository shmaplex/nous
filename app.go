package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

// Article represents a news article stored locally in OrbitDB.
type Article struct {
	ID                string   `json:"id,omitempty"`
	Title             string   `json:"title"`
	URL               string   `json:"url"`
	Content           string   `json:"content"`
	Bias              *string  `json:"bias,omitempty"` // "left"|"center"|"right"
	Antithesis        *string  `json:"antithesis,omitempty"`
	Philosophical     *string  `json:"philosophical,omitempty"`
	Source            *string  `json:"source,omitempty"`
	Category          *string  `json:"category,omitempty"`
	Author            *string  `json:"author,omitempty"`
	PublishedAt       *string  `json:"publishedAt,omitempty"`
	Tags              []string `json:"tags,omitempty"`
	Sentiment         *string  `json:"sentiment,omitempty"`
	Edition           *string  `json:"edition,omitempty"`           // "international"|"us"|"kr"
	Analyzed          *bool    `json:"analyzed,omitempty"`          // flag to indicate analysis completed
	IPFSHash          *string  `json:"ipfsHash,omitempty"`          // IPFS hash of full content
	AnalysisTimestamp *string  `json:"analysisTimestamp,omitempty"` // when analysis was performed
}

// Source represents a data source for articles or feeds.
type Source struct {
	Name         string   `json:"name"`
	Endpoint     string   `json:"endpoint"`         // replaces URL
	APIKey       string   `json:"apiKey,omitempty"` // optional user-entered key
	Instructions string   `json:"instructions,omitempty"`
	APILink      string   `json:"apiLink,omitempty"`
	Enabled      *bool    `json:"enabled,omitempty"`     // true if source should be active
	RequiresKey  *bool    `json:"requiresKey,omitempty"` // optional future flag
	Category     *string  `json:"category,omitempty"`    // optional categorization
	Tags         []string `json:"tags,omitempty"`        // optional tags
	Language     *string  `json:"language,omitempty"`    // optional language code
	Region       *string  `json:"region,omitempty"`      // optional region code
	AuthType     *string  `json:"authType,omitempty"`    // optional: "none", "apiKey", "bearerToken", "oauth"
}

type App struct {
	ctx      context.Context
	p2pCmd   *exec.Cmd
	Location string
}

var ORBITDB_KEYSTORE_PATH = "frontend/orbitdb-keystore"
var ORBITDB_DB_PATH = "frontend/orbitdb-databases"

var instanceID int
var NODE_ID string = "nous-node-1"
var p2pProcessRunning bool
var httpPortBase int = 9001
var libp2pPortBase int = 4001
var keystorePath string = ORBITDB_KEYSTORE_PATH
var dbPath string = ORBITDB_DB_PATH

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

	log.Println(a.StartP2PNode())
}

// StartP2PNode launches the node process
func (a *App) StartP2PNode() string {
	if p2pProcessRunning {
		return "P2P node already running"
	}

	CleanOrbitDBLocks()

	httpPort := httpPortBase + instanceID
	libp2pPort := libp2pPortBase + instanceID

	// Determine bundled Node binary based on OS
	var nodeBinary string
	switch runtime.GOOS {
	case "darwin":
		nodeBinary = "./frontend/dist/bin/node-macos"
	case "linux":
		nodeBinary = "./frontend/dist/bin/node-linux"
	case "windows":
		nodeBinary = "./frontend/dist/bin/node-win.exe"
	default:
		return "Unsupported OS"
	}

	// Check that the bundled Node binary exists
	if _, err := os.Stat(nodeBinary); os.IsNotExist(err) {
		return fmt.Sprintf("Bundled Node binary not found at %s", nodeBinary)
	}

	// Path to the compiled P2P script
	jsNodePath := "./frontend/dist/p2p/setup.js"
	if _, err := os.Stat(jsNodePath); os.IsNotExist(err) {
		return fmt.Sprintf("Compiled P2P node not found at %s. Run build first.", jsNodePath)
	}

	// ✅ Create the Cmd first
	a.p2pCmd = exec.Command(nodeBinary, jsNodePath)

	// ✅ Then set environment variables
	a.p2pCmd.Env = append(os.Environ(),
		fmt.Sprintf("HTTP_PORT=%d", httpPort),
		fmt.Sprintf("LIBP2P_ADDR=/ip4/127.0.0.1/tcp/%d", libp2pPort),
		fmt.Sprintf("NODE_ID=%s", NODE_ID),
		fmt.Sprintf("KEYSTORE_PATH=%s", keystorePath),
		fmt.Sprintf("DB_PATH=%s", dbPath),
	)

	stdout, err := a.p2pCmd.StdoutPipe()
	if err != nil {
		return fmt.Sprintf("Failed to get stdout: %v", err)
	}
	stderr, err := a.p2pCmd.StderrPipe()
	if err != nil {
		return fmt.Sprintf("Failed to get stderr: %v", err)
	}

	if err := a.p2pCmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start P2P node: %v", err)
	}

	p2pProcessRunning = true

	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.Contains(line, "READY") {
				log.Println("[P2P] Node reported READY")
			}
			log.Println("[P2P]", line)
		}
	}()

	go io.Copy(os.Stderr, stderr)

	return "P2P node started"
}

// StopP2PNode stops the node process
func (a *App) StopP2PNode() string {
	if a.p2pCmd != nil && a.p2pCmd.Process != nil {
		a.p2pCmd.Process.Signal(os.Interrupt)
		a.p2pCmd = nil
	}

	KillLingeringNode()

	return "P2P node stopped"
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

func (a *App) AppStatus() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/status", instanceHTTPPort()))
	if err != nil {
		return fmt.Sprintf(`{"running": false, "port": %d, "error": "%v"}`, instanceHTTPPort(), err)
	}
	return body
}
