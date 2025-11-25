package main

import (
	"fmt"
	"os/exec"
	"runtime"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// OpenSettings triggers the React settings modal
func (a *App) OpenSettings() {
	wailsruntime.EventsEmit(a.ctx, "open-settings", nil)
}

// OpenAbout shows the native About dialog
func (a *App) OpenAbout() {
	wailsruntime.MessageDialog(a.ctx, wailsruntime.MessageDialogOptions{
		Type:    wailsruntime.InfoDialog,
		Title:   "About Nous",
		Message: "Nous - P2P News Analysis\nVersion 1.0.0\n\n© 2025 Shmaplex\n\nLicense: CSL\nhttps://github.com/shmaplex/csl",
	})
}

// OpenURL opens a URL in the default system browser
func (a *App) OpenURL(url string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return fmt.Errorf("unsupported platform")
	}

	return cmd.Start()
}
