package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

// GET /status
func (a *App) AppStatus() string {
	url := GetNodeBaseUrl() + "/status"

	resp, err := http.Get(url)
	if err != nil {
		return fmt.Sprintf(
			`{"running": false, "port": %d, "error": "GET failed: %v"}`,
			instanceHTTPPort(),
			err,
		)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

// POST /status
func (a *App) AppUpdateStatus(jsonPayload string) string {
	url := GetNodeBaseUrl() + "/status"

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(jsonPayload)))
	if err != nil {
		return fmt.Sprintf(`{"error":"request build failed: %v"}`, err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Sprintf(`{"error":"POST failed: %v"}`, err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return string(body)
}

// DELETE /status
func (a *App) AppDeleteStatus() string {
	url := GetNodeBaseUrl() + "/status"

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Sprintf(`{"error":"request build failed: %v"}`, err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Sprintf(`{"error":"DELETE failed: %v"}`, err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return string(body)
}
