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

// =========================
// P2P Node Configuration
// =========================

// Heap memory options (in MB) for Node.js process
// These are used to configure the V8 engine memory limit for heavy workloads, such as AI processing.
const (
	HeapSmall  = 2048 // 2GB, suitable for light workloads
	HeapMedium = 6144 // 6GB, recommended for medium AI workloads
	HeapLarge  = 8192 // 8GB+, for heavy AI or large dataset processing
)

// DefaultHeap is the currently used heap size (in MB).
// Can be changed at runtime or per instance if needed.
var DefaultHeap = HeapMedium

// =========================
// P2P Node Runtime Tracking
// =========================

// p2pProcessRunning tracks whether the P2P node process is currently running.
// This prevents starting multiple instances of the node accidentally.
var p2pProcessRunning bool

// =========================
// P2P Node Functions
// =========================

// StartP2PNode starts the local P2P node process for the application.
//
// It performs the following steps:
//  1. Checks if the node is already running and returns early if so.
//  2. Cleans any leftover OrbitDB lock files to avoid startup issues.
//  3. Determines the HTTP and LibP2P ports for this instance.
//  4. Selects the correct Node.js binary based on the OS.
//  5. Verifies that the binary and compiled server script exist.
//  6. Prepares the command to launch Node.js with the configured memory heap.
//  7. Sets environment variables for the node (ports, identity, keystore, DB path).
//  8. Captures stdout and stderr streams for logging.
//  9. Starts the Node.js process and monitors stdout for "READY" messages.
//
// Returns a string describing the result of the start attempt.
func (a *App) StartP2PNode() (string, error) {
	if p2pProcessRunning {
		return "", fmt.Errorf("P2P node already running")
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
		return "", fmt.Errorf("unsupported OS")
	}

	// Verify the node binary exists
	if _, err := os.Stat(nodeBinary); os.IsNotExist(err) {
		return "", fmt.Errorf("bundled Node binary not found at %s", nodeBinary)
	}

	// Path to compiled server setup script
	jsNodePath := "./backend/dist/setup.js"
	if _, err := os.Stat(jsNodePath); os.IsNotExist(err) {
		return "", fmt.Errorf("compiled server node not found at %s. Run build first", jsNodePath)
	}

	// Prepare Node.js command
	a.p2pCmd = exec.Command(
		nodeBinary,
		fmt.Sprintf("--max-old-space-size=%d", DefaultHeap),
		jsNodePath,
	)

	// Set environment variables
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
		return "", fmt.Errorf("failed to get stdout: %v", err)
	}
	stderr, err := a.p2pCmd.StderrPipe()
	if err != nil {
		return "", fmt.Errorf("failed to get stderr: %v", err)
	}

	// Start the Node.js process
	if err := a.p2pCmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start P2P node: %v", err)
	}

	// Mark as running
	p2pProcessRunning = true

	// Log stdout lines and detect "READY" message
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.Contains(line, "READY") {
				log.Println("[P2P] Node reported READY")
			}
			log.Println("[P2P stdout]", line)
		}
	}()

	// Forward stderr to main stderr
	go io.Copy(os.Stderr, stderr)

	return fmt.Sprintf("P2P node started with %d MB heap", DefaultHeap), nil
}

// StopP2PNode stops the local P2P node process cleanly.
//
// It performs the following steps:
//  1. Sends an interrupt signal to the running node process.
//  2. Cleans any leftover OrbitDB lock files.
//  3. Kills any lingering Node.js processes to ensure a clean shutdown.
//  4. Logs success and returns true.
//
// Returns true if the stop procedure was initiated.
func (a *App) StopP2PNode() bool {
	if a.p2pCmd != nil && a.p2pCmd.Process != nil {
		a.p2pCmd.Process.Signal(os.Interrupt)
		a.p2pCmd = nil
	}

	CleanOrbitDBLocks()
	KillLingeringNode()
	log.Println("[P2P] Node stopped successfully")
	return true
}
