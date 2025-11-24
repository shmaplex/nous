package main

import (
	"encoding/json"
	"fmt"
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
