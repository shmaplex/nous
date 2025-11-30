package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// KillLingeringNode kills any lingering bundled node processes
func KillLingeringNode() {
	binaries := []string{
		"node-macos",
		"node-linux",
		"node-win.exe",
	}

	for _, bin := range binaries {
		switch runtime.GOOS {
		case "windows":
			out, err := exec.Command("tasklist").Output()
			if err != nil {
				log.Println("Error listing processes:", err)
				continue
			}
			for _, line := range strings.Split(string(out), "\n") {
				if strings.Contains(line, bin) {
					fields := strings.Fields(line)
					if len(fields) > 1 {
						pid := fields[1]
						exec.Command("taskkill", "/PID", pid, "/F").Run()
						log.Println("Killed bundled Node process (Windows):", pid)
					}
				}
			}

		default: // macOS + Linux
			out, err := exec.Command("pgrep", "-f", bin).Output()
			if err != nil {
				continue
			}
			for _, pid := range strings.Fields(string(out)) {
				exec.Command("kill", "-9", pid).Run()
				log.Println("Killed bundled Node process:", pid)
			}
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

// Per-instance port helper
func instanceHTTPPort() int {
	return httpPortBase + instanceID
}

// HTTP GET helper with debug logging
func get(url string) (string, error) {
	log.Printf("GET %s\n", url)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("GET ERROR %s -> %v\n", url, err)
		return "", err
	}
	defer resp.Body.Close()

	log.Printf("GET %s -> status %d\n", url, resp.StatusCode)

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("GET READ ERROR %s -> %v\n", url, err)
		return "", err
	}

	// Optional: print truncated body (helps debug HTML errors)
	if len(b) > 0 {
		preview := b
		if len(b) > 300 {
			preview = b[:300]
		}
		log.Printf("GET %s -> body (first 300 bytes): %s\n", url, string(preview))
	}

	return string(b), nil
}

// HTTP POST helper
func post(url string, data interface{}) (string, error) {
	// Marshal payload to JSON
	payload, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	// Log the payload
	log.Printf("POST %s\nPayload: %s\n", url, string(payload))

	// Send the POST request
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Read response body
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
