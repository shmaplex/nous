package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Article represents a news article stored locally in OrbitDB.
type Article struct {
	ID            string   `json:"id,omitempty"`
	Title         string   `json:"title"`
	URL           string   `json:"url"`
	Content       string   `json:"content"`
	Bias          *string  `json:"bias,omitempty"`
	Antithesis    *string  `json:"antithesis,omitempty"`
	Philosophical *string  `json:"philosophical,omitempty"`
	Source        *string  `json:"source,omitempty"`
	Category      *string  `json:"category,omitempty"`
	Author        *string  `json:"author,omitempty"`
	PublishedAt   *string  `json:"publishedAt,omitempty"`
	Tags          []string `json:"tags,omitempty"`
	Sentiment     *string  `json:"sentiment,omitempty"`
}

type Source struct {
	Name         string `json:"name"`
	URL          string `json:"url"`
	Instructions string `json:"instructions,omitempty"`
	APILink      string `json:"apiLink,omitempty"`
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

func KillLingeringNode() {
	scriptPath := "frontend/src/p2p/setup.ts"

	switch runtime.GOOS {
	case "windows":
		out, err := exec.Command("tasklist").Output()
		if err != nil {
			log.Println("Error listing processes:", err)
			return
		}
		for _, line := range strings.Split(string(out), "\n") {
			if strings.Contains(line, "node.exe") && strings.Contains(line, scriptPath) {
				fields := strings.Fields(line)
				if len(fields) > 1 {
					pid := fields[1]
					exec.Command("taskkill", "/PID", pid, "/F").Run()
					log.Println("Killed Node process on Windows:", pid)
				}
			}
		}
	default: // macOS / Linux
		out, err := exec.Command("pgrep", "-f", scriptPath).Output()
		if err != nil {
			return
		}
		for _, pid := range strings.Fields(string(out)) {
			exec.Command("kill", "-9", pid).Run()
			log.Println("Killed Node process:", pid)
		}
	}
}

// CleanOrbitDBLocks removes leftover LOCK files
func CleanOrbitDBLocks() {
	paths := []string{ORBITDB_DB_PATH, ORBITDB_KEYSTORE_PATH}

	for _, base := range paths {
		_ = filepath.Walk(base, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.Name() == "LOCK" {
				if rmErr := os.Remove(path); rmErr != nil {
					log.Println("Failed to remove LOCK file:", path, rmErr)
				} else {
					log.Println("Removed leftover LOCK file:", path)
				}
			}
			return nil
		})
	}
}

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

//
// ----- HTTP HELPERS -----
//

func get(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}

func post(url string, data interface{}) (string, error) {
	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// Per-instance port helper
func instanceHTTPPort() int {
	return httpPortBase + instanceID
}

//
// ----- PUBLIC API CALLED FROM FRONTEND -----
//

// FetchArticles retrieves all articles
func (a *App) FetchArticles() string {
	body, err := get("http://127.0.0.1:9001/articles")
	if err != nil {
		return fmt.Sprintf("Error fetching articles: %v", err)
	}
	return body
}

// SaveArticle saves a new article, optionally with an edition
func (a *App) SaveArticle(title, url, content, edition string) string {
	data := map[string]string{
		"title":   title,
		"url":     url,
		"content": content,
	}
	if edition != "" {
		data["edition"] = edition
	}

	body, err := post("http://127.0.0.1:9001/save", data)
	if err != nil {
		return fmt.Sprintf("Error saving article: %v", err)
	}
	return body
}

// DeleteArticle removes an article by ID
func (a *App) DeleteArticle(id string) string {
	url := fmt.Sprintf("http://127.0.0.1:9001/delete/%s", id)
	body, err := get(url)
	if err != nil {
		return fmt.Sprintf("Error deleting article: %v", err)
	}
	return body
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

func (a *App) OpenSettings() {
	// Trigger React modal via Wails runtime events
	wailsruntime.EventsEmit(a.ctx, "open-settings", nil)
}

func (a *App) OpenAbout() {
	// Native system About dialog
	wailsruntime.MessageDialog(a.ctx, wailsruntime.MessageDialogOptions{
		Type:    wailsruntime.InfoDialog,
		Title:   "About Nous",
		Message: "Nous - P2P News Analysis\nVersion 1.0.0\n\n© 2025 Shmaplex\n\nLicense: CSL\nhttps://github.com/shmaplex/csl",
	})
}

// SaveSources persists sources locally (e.g., JSON file)
func (a *App) SaveSources(sources []Source) error {
	// Ensure the data directory exists
	if err := os.MkdirAll("data", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	data, err := json.Marshal(sources)
	if err != nil {
		return err
	}

	return os.WriteFile("data/sources.json", data, 0644)
}

// LoadSources loads sources from local file
func (a *App) LoadSources() ([]Source, error) {
	// Ensure the data directory exists
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		return nil, nil // no data folder means no sources yet
	}

	data, err := os.ReadFile("data/sources.json")
	if err != nil {
		// return nil if file doesn't exist
		return nil, nil
	}

	var sources []Source
	if err := json.Unmarshal(data, &sources); err != nil {
		return nil, err
	}

	return sources, nil
}

func (a *App) OpenURL(url string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		// macOS
		cmd = exec.Command("open", url)
	case "linux":
		// Linux
		cmd = exec.Command("xdg-open", url)
	case "windows":
		// Windows
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return fmt.Errorf("unsupported platform")
	}

	return cmd.Start()
}

func (a *App) AppStatus() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/status", instanceHTTPPort()))
	if err != nil {
		return fmt.Sprintf(`{"running": false, "port": %d, "error": "%v"}`, instanceHTTPPort(), err)
	}
	return body
}
