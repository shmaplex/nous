// p2p_node.go
package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// p2pProcessRunning tracks whether the P2P node process is currently running
var p2pProcessRunning bool

// StartP2PNode starts the local P2P node process for the application.
//
// It sets up the environment variables, launches the node executable,
// and captures stdout and stderr streams for logging. If the node is already
// running, it will return immediately.
//
// Returns a string describing the result of the start attempt.
func (a *App) StartP2PNode() string {
	if p2pProcessRunning {
		return "P2P node already running"
	}

	// Clean any leftover OrbitDB lock files before starting
	CleanOrbitDBLocks()

	// Determine ports for this instance
	httpPort := httpPortBase + instanceID
	libp2pPort := libp2pPortBase + instanceID

	// Determine node binary based on OS
	var nodeBinary string
	switch runtime.GOOS {
	case "darwin":
		nodeBinary = "./frontend/dist/bin/node-macos"
	case "linux":
		nodeBinary = "./frontend/dist/bin/node-linux"
	case "windows":
		nodeBinary = "./frontend/dist/bin/node-win.exe"
	default:
		return "Unsupported OS"
	}

	// Check if the node binary exists
	if _, err := os.Stat(nodeBinary); os.IsNotExist(err) {
		return fmt.Sprintf("Bundled Node binary not found at %s", nodeBinary)
	}

	// Path to compiled server setup script
	jsNodePath := "./backend/dist/setup.js"
	if _, err := os.Stat(jsNodePath); os.IsNotExist(err) {
		return fmt.Sprintf("Compiled server node not found at %s. Run build first.", jsNodePath)
	}

	// Prepare the command
	a.p2pCmd = exec.Command(nodeBinary, jsNodePath)
	a.p2pCmd.Env = append(os.Environ(),
		fmt.Sprintf("HTTP_PORT=%d", httpPort),
		fmt.Sprintf("LIBP2P_ADDR=/ip4/127.0.0.1/tcp/%d", libp2pPort),
		fmt.Sprintf("IDENTITY_ID=%s", IDENTITY_ID),
		fmt.Sprintf("ORBITDB_KEYSTORE_PATH=%s", keystorePath),
		fmt.Sprintf("ORBITDB_DB_PATH=%s", dbPath),
	)

	// Capture stdout and stderr
	stdout, err := a.p2pCmd.StdoutPipe()
	if err != nil {
		return fmt.Sprintf("Failed to get stdout: %v", err)
	}
	stderr, err := a.p2pCmd.StderrPipe()
	if err != nil {
		return fmt.Sprintf("Failed to get stderr: %v", err)
	}

	// Start the P2P node process
	if err := a.p2pCmd.Start(); err != nil {
		return fmt.Sprintf("Failed to start P2P node: %v", err)
	}

	p2pProcessRunning = true

	// Log stdout lines and detect "READY" message
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.Contains(line, "READY") {
				log.Println("[P2P] Node reported READY")
			}
			log.Println("[P2P]", line)
		}
	}()

	// Forward stderr to the main process stderr
	go io.Copy(os.Stderr, stderr)

	return "P2P node started"
}

// StopP2PNode stops the local P2P node process cleanly.
//
// It sends an interrupt signal to the process and then attempts to
// kill any lingering node processes that might still be running.
//
// Returns a string describing the result of the stop attempt.
func (a *App) StopP2PNode() bool {
	if a.p2pCmd != nil && a.p2pCmd.Process != nil {
		a.p2pCmd.Process.Signal(os.Interrupt)
		a.p2pCmd = nil
	}

	// remove leftover LOCK files
	CleanOrbitDBLocks()

	// Kill any leftover Node processes
	KillLingeringNode()
	log.Println("[P2P] Node stopped successfully")
	return true
}
