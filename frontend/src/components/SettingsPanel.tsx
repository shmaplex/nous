import React, { useContext } from "react";
import clsx from "clsx";
import { ThemeContext } from "../context/ThemeContext";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useContext(ThemeContext);

  // Stub functions
  const purgeCache = () => alert("Local cache purged (stub)");
  const showPeerID = () => alert("Your Peer ID: QmXYZ123... (stub)");
  const toggleSync = () => alert("Sync toggled (stub)");

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        "bg-black/30 backdrop-blur-md"
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "rounded-xl w-11/12 max-w-lg p-6 transform transition-transform duration-300 shadow-2xl scale-95",
          isOpen && "scale-100",
          "bg-card text-card-foreground"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-6">Settings</h2>

        {/* Theme Mode */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium">Theme Mode</h3>
          <div className="flex flex-wrap">
            {["auto", "light", "dark"].map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode as "auto" | "light" | "dark")}
                className={clsx(
                  "mr-2 mb-2 px-4 py-2 rounded border font-semibold",
                  theme === mode
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-card-foreground border-card"
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* P2P / OrbitDB */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium">Network / P2P</h3>
          <div className="flex flex-wrap">
            <button
              onClick={showPeerID}
              className="mr-2 mb-2 px-4 py-2 rounded bg-accent text-accent-foreground"
            >
              Show Peer ID
            </button>
            <button
              onClick={toggleSync}
              className="mr-2 mb-2 px-4 py-2 rounded bg-accent text-accent-foreground"
            >
              Toggle Sync
            </button>
          </div>
        </div>

        {/* Local Storage */}
        <div className="mb-6">
          <h3 className="mb-2 font-medium">Local Storage</h3>
          <button
            onClick={purgeCache}
            className="px-4 py-2 rounded bg-destructive text-foreground"
          >
            Purge Local Cache
          </button>
        </div>

        {/* Close Button */}
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-secondary text-secondary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;