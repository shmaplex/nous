package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
)

// Register OS signals to run shutdown
func registerDevModeShutdown(app *App) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Println("🛑 Development mode exit detected. Shutting down P2P node...")
		app.StopP2PNode() // run your shutdown routine
		os.Exit(0)
	}()
}
