import React from "react";

interface FiltersProps {
  filter: string;
  onChange: (val: string) => void;
}

const Filters: React.FC<FiltersProps> = ({ filter, onChange }) => {
  const options = ["all", "left", "center", "right"];

  return (
    <nav className="flex space-x-2 mb-6">
      {options.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`btn-filter ${
            filter === f ? "btn-filter-active" : "btn-filter-inactive"
          }`}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </nav>
  );
};

export default Filters;