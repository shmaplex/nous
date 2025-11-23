package main

import (
	"embed"
	"log"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	AppMenu := menu.NewMenu()

	if runtime.GOOS == "darwin" {
		// macOS native app menu
		appMenu := menu.AppMenu() // Includes app name, Quit, Hide, etc.

		// Inject Settings into the AppMenu with Command+;
		settingsItem := menu.Text("Settings", keys.CmdOrCtrl(";"), func(_ *menu.CallbackData) {
			app.OpenSettings()
		})
		appMenu.SubMenu = &menu.Menu{Items: []*menu.MenuItem{settingsItem}}

		// Optionally add Quit explicitly (Cmd+Q is usually automatic)
		quitItem := menu.Text("Quit", keys.CmdOrCtrl("Q"), func(_ *menu.CallbackData) {
			wailsruntime.Quit(app.ctx)
		})
		appMenu.SubMenu.Items = append(appMenu.SubMenu.Items, quitItem)

		AppMenu.Append(appMenu)

		// Add → Article menu item
		addMenu := AppMenu.AddSubmenu("Add")
		addMenu.AddText("Article", keys.CmdOrCtrl("N"), func(_ *menu.CallbackData) {
			wailsruntime.EventsEmit(app.ctx, "open-add-article")
		})

		// Standard Edit menu for copy/paste/undo
		AppMenu.Append(menu.EditMenu())

		// Help menu
		helpMenu := AppMenu.AddSubmenu("Help")
		helpMenu.AddText("About", nil, func(_ *menu.CallbackData) {
			app.OpenAbout()
		})
	} else {
		// Windows/Linux: custom top-level Nous menu
		nousMenu := AppMenu.AddSubmenu("Nous")
		nousMenu.AddText("Settings", keys.CmdOrCtrl(";"), func(_ *menu.CallbackData) {
			app.OpenSettings()
		})
		nousMenu.AddSeparator()
		nousMenu.AddText("Quit", keys.CmdOrCtrl("Q"), func(_ *menu.CallbackData) {
			wailsruntime.Quit(app.ctx)
		})

		// Help menu
		helpMenu := AppMenu.AddSubmenu("Help")
		helpMenu.AddText("About", nil, func(_ *menu.CallbackData) {
			app.OpenAbout()
		})
	}

	err := wails.Run(&options.App{
		Title:  "Nous - P2P News Analysis",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.Startup,
		OnBeforeClose:    app.BeforeClose, // cleanup before closing window
		// OnShutdown: func(ctx context.Context) {
		// 	app.StopP2PNode()
		// },
		Menu: AppMenu,
		Bind: []interface{}{app},
	})

	if err != nil {
		log.Fatal("Error starting app:", err)
	}
}
