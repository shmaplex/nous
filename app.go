package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
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

// NewApp creates a new App instance
func NewApp() *App {
	return &App{}
}

// Startup is called by Wails on app startup
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("Nous App started")

	msg := a.StartP2PNode()
	log.Println(msg)
}

//
// ----- P2P NODE PROCESS MANAGEMENT -----
//

// Start Node.js Helia + OrbitDB process
func (a *App) StartP2PNode() string {
	if a.p2pCmd != nil {
		return "P2P node already running"
	}

	a.p2pCmd = exec.Command("node", "frontend/src/p2p/node.ts")

	// Capture stdout to detect READY signal
	stdout, _ := a.p2pCmd.StdoutPipe()
	stderr, _ := a.p2pCmd.StderrPipe()

	if err := a.p2pCmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start P2P node: %v", err)
	}

	go func() {
		buf := make([]byte, 1024)
		for {
			n, _ := stdout.Read(buf)
			if n > 0 {
				out := string(buf[:n])
				if out == "READY\n" || strings.Contains(out, "READY") {
					log.Println("P2P node is ready")
				}
			}
		}
	}()

	go func() {
		io.Copy(os.Stderr, stderr)
	}()

	return "P2P node started"
}

func (a *App) StopP2PNode() string {
	if a.p2pCmd == nil {
		return "P2P node not running"
	}
	if err := a.p2pCmd.Process.Kill(); err != nil {
		return fmt.Sprintf("Failed to stop P2P node: %v", err)
	}
	a.p2pCmd = nil
	return "P2P node stopped"
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
	data, err := json.Marshal(sources)
	if err != nil {
		return err
	}
	return os.WriteFile("sources.json", data, 0644)
}

// LoadSources loads sources from local file
func (a *App) LoadSources() ([]Source, error) {
	data, err := os.ReadFile("sources.json")
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
	body, err := get("http://127.0.0.1:9001/status")
	if err != nil {
		return fmt.Sprintf("Error fetching status: %v", err)
	}
	return body
}
