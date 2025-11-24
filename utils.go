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

// KillLingeringNode kills any leftover node processes running the P2P script
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
	default:
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

// Per-instance port helper
func instanceHTTPPort() int {
	return httpPortBase + instanceID
}

// HTTP GET helper
func get(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// HTTP POST helper
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

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
