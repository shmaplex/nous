package main

import (
	"fmt"
	"log"
)

// FetchDebugLogs calls GET /debug/logs
func (a *App) FetchDebugLogs() string {
	url := fmt.Sprintf("%s/debug/logs", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching debug logs: %v", err)
		return fmt.Sprintf("Error fetching debug logs: %v", err)
	}
	return body
}

// AddDebugLog calls POST /debug/log
func (a *App) AddDebugLog(message string, level string, meta map[string]interface{}) string {
	url := fmt.Sprintf("%s/debug/log", GetNodeBaseUrl())
	payload := map[string]interface{}{
		"message": message,
		"level":   level,
		"meta":    meta,
	}

	body, err := post(url, payload)
	if err != nil {
		log.Printf("Error adding debug log: %v", err)
		return fmt.Sprintf("Error adding debug log: %v", err)
	}
	return body
}
