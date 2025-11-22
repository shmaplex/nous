package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"

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

	a.p2pCmd = exec.Command("node", "p2p-node.js")
	a.p2pCmd.Stdout = nil
	a.p2pCmd.Stderr = nil

	if err := a.p2pCmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start P2P node: %v", err)
	}
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

// SaveArticle saves a new article
func (a *App) SaveArticle(title, url, content string) string {
	data := map[string]string{
		"title":   title,
		"url":     url,
		"content": content,
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
		return "No location set"
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
