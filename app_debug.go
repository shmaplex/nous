package main

import (
	"encoding/json"
	"fmt"
	"log"
)

// FetchDebugLogs calls GET /debug/logs
func (a *App) FetchDebugLogs() string {
	url := fmt.Sprintf("%s/debug/logs", GetNodeBaseUrl())
	body, err := get(url)

	if err != nil {
		log.Printf("Error fetching debug logs: %v", err)

		resp := APIResponse{
			Success: false,
			Error:   err.Error(),
			Data:    []interface{}{}, // always valid JSON array
		}
		jsonBytes, _ := json.Marshal(resp)
		return string(jsonBytes)
	}

	// Wrap the body inside APIResponse
	var parsed interface{}
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		parsed = []interface{}{}
	}

	resp := APIResponse{
		Success: true,
		Data:    parsed,
	}
	jsonBytes, _ := json.Marshal(resp)
	return string(jsonBytes)
}

// AddDebugLog calls POST /debug/log with a full DebugLogEntry
func (a *App) AddDebugLog(entry DebugLogEntry) string {
	url := fmt.Sprintf("%s/debug/log", GetNodeBaseUrl())
	body, err := post(url, entry)
	if err != nil {
		log.Printf("Error adding debug log: %v", err)
		return fmt.Sprintf("Error adding debug log: %v", err)
	}
	return body
}
