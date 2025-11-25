package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// SaveSources persists sources locally (e.g., JSON file)
func (a *App) SaveSources(sources []Source) error {
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
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		return nil, nil
	}

	data, err := os.ReadFile("data/sources.json")
	if err != nil {
		return nil, nil
	}

	var sources []Source
	if err := json.Unmarshal(data, &sources); err != nil {
		return nil, err
	}

	t := time.Now()
	iso := t.Format(time.RFC3339)

	// Optional: auto-enable if APIKey exists
	for i := range sources {
		sources[i].LastUpdated = &iso
		if sources[i].Enabled == nil {
			sources[i].Enabled = new(bool)
			*sources[i].Enabled = sources[i].APIKey != nil
		}
	}

	return sources, nil
}

// FetchArticlesBySources calls the P2P node to fetch articles from the provided sources
// and returns them as a slice of Article objects.
func (a *App) FetchArticlesBySources(sources []Source) ([]Article, error) {
	url := fmt.Sprintf("%s/articles/sources/fetch", GetNodeBaseUrl())
	body := map[string]interface{}{
		"sources": sources,
	}
	bodyJSON, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal sources: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("POST request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var respObj ArticlesResponse
	if err := json.Unmarshal(respBody, &respObj); err != nil {
		return nil, fmt.Errorf("failed to parse articles JSON: %w", err)
	}

	return respObj.Articles, nil
}
