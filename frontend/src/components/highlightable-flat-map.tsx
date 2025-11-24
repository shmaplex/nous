// frontend/src/components/highlightable-flat-map.tsx
import { memo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// Lightweight, well-maintained world topology
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Props {
	highlightedCountries?: string[];
	highlightedContinents?: string[];
	onCountryClick?: (countryCode: string) => void;
	width?: number;
	height?: number;
}

export const HighlightableFlatMap = memo(
	({
		highlightedCountries = [],
		highlightedContinents = [],
		onCountryClick,
		width = 350,
		height = 240,
	}: Props) => {
		return (
			<ComposableMap
				width={width}
				height={height}
				projectionConfig={{ scale: 130 }}
				style={{ width: "100%", height: "auto" }}
			>
				<Geographies geography={geoUrl}>
					{({ geographies }) =>
						geographies.map((geo) => {
							const iso = geo.properties.ISO_A3;
							const continent = geo.properties.CONTINENT;

							const isHighlighted =
								highlightedCountries.includes(iso) || highlightedContinents.includes(continent);

							return (
								<Geography
									key={geo.rsmKey}
									geography={geo}
									onClick={() => onCountryClick?.(iso)}
									style={{
										default: {
											fill: isHighlighted
												? "var(--color-accent)" // highlighted
												: "var(--color-muted)", // default country fill
											stroke: "var(--color-border)",
											strokeWidth: 0.5,
											outline: "none",
											opacity: isHighlighted ? 1 : 0.7,
											transition: "fill 0.2s ease, opacity 0.2s ease",
										},
										hover: {
											fill: "var(--color-accent)",
											cursor: "pointer",
										},
										pressed: {
											fill: "var(--color-accent)",
										},
									}}
								/>
							);
						})
					}
				</Geographies>
			</ComposableMap>
		);
	},
);
