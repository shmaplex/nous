import React from "react";
import logo from "../assets/images/logo-universal.png";

interface HeaderProps {
  location: string;
  onLocationChange: (val: string) => void;
  onUpdateLocation: () => void;
}

const Header: React.FC<HeaderProps> = ({ location, onLocationChange, onUpdateLocation }) => {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between mb-6">
      <div className="flex items-center space-x-4 mb-4 md:mb-0">
        <img src={logo} alt="Nous" className="h-12 w-12" />
        <h1 className="text-2xl font-serif font-bold">Nous - P2P News Dashboard</h1>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Set Location"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={onUpdateLocation}
          className="btn-primary"
        >
          Update
        </button>
      </div>
    </header>
  );
};

export default Header;