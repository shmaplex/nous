package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os/exec"
)

// Article struct (OPTIONAL, for internal use only)
type Article struct {
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

func NewApp() *App {
	return &App{}
}

// Wails lifecycle method
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

	err := a.p2pCmd.Start()
	if err != nil {
		return fmt.Sprintf("Failed to start P2P node: %v", err)
	}

	return "P2P node started"
}

func (a *App) StopP2PNode() string {
	if a.p2pCmd == nil {
		return "P2P node not running"
	}

	err := a.p2pCmd.Process.Kill()
	if err != nil {
		return fmt.Sprintf("Failed to stop P2P node: %v", err)
	}

	a.p2pCmd = nil
	return "P2P node stopped"
}

//
// ----- HTTP HELPERS (MODERN GO) -----
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

func post(url string, data []byte) (string, error) {
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(data))
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
// ----- PUBLIC API CALLED FROM REACT/WAILS FRONTEND -----
//

// Fetch articles stored in OrbitDB
func (a *App) FetchArticles() string {
	body, err := get("http://127.0.0.1:9001/articles")
	if err != nil {
		return err.Error()
	}
	return body
}

// Save a new article to OrbitDB
func (a *App) SaveArticle(title, url, content string) string {
	jsonStr := fmt.Sprintf(
		`{"title":"%s","url":"%s","content":"%s"}`,
		title, url, content,
	)

	body, err := post("http://127.0.0.1:9001/save", []byte(jsonStr))
	if err != nil {
		return err.Error()
	}

	return body
}

func (a *App) DeleteArticle(id string) string {
	url := fmt.Sprintf("http://127.0.0.1:9001/delete/%s", id)

	body, err := get(url)
	if err != nil {
		return err.Error()
	}
	return body
}

// Simple example method
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, welcome to Nous!", name)
}

// Called from JS
func (a *App) SetLocation(loc string) string {
	a.Location = loc
	return "Location set to: " + loc
}

// Called from JS
func (a *App) GetLocation() string {
	if a.Location == "" {
		return "No location set"
	}
	return a.Location
}
