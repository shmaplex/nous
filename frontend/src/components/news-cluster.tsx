// frontend/src/components/news-cluster.tsx
import { HighlightableFlatMap } from "./highlightable-flat-map";

interface Source {
	id: string;
	href: string;
	img: string;
	alt: string; // here we treat alt as ISO A3 code for highlighting
}

interface Props {
	title: string;
	sources: Source[];
}

export default function NewsCluster({ title, sources }: Props) {
	const highlightedCountries = sources.map((s) => s.alt).filter(Boolean);

	return (
		<div className="bg-tertiary-light w-full h-full dark:bg-dark-light lg:col-span-2 relative">
			<section className="flex flex-col gap-[0.7rem] tablet:gap-[1rem] p-2 tablet:p-[1rem] h-full cursor-pointer text-12 font-normal relative">
				{/* Overlay Click Blockers */}
				<div className="absolute top-0 bottom-0 left-0 right-0 lg:hidden z-10" />
				<div className="absolute top-0 h-20 left-0 right-0 hidden lg:block z-10" />

				<div className="flex gap-2 items-start relative">
					{/* Timeline + Source pills */}
					<div className="flex flex-col gap-4 relative">
						<div className="border-t border-dark-heavy dark:border-light-heavy mt-4 h-4" />

						<div className="relative h-[3.2rem] w-[20rem]">
							{sources.map((src, i) => (
								<a
									key={src.id}
									href={src.href}
									className="flex absolute"
									style={{
										zIndex: i,
										height: "3.2rem",
										width: "3.2rem",
										marginLeft: `${260 + i}px`,
										marginTop: "-1.6rem",
									}}
								>
									<img src={src.img} alt={src.alt} />
								</a>
							))}
						</div>
					</div>

					{/* Map Area */}
					<div className="flex-1 h-[200px] tablet:h-[260px] relative z-0 rounded-lg overflow-hidden">
						<HighlightableFlatMap highlightedCountries={highlightedCountries} />
					</div>
				</div>

				{/* Title */}
				<div className="pt-2 text-14 font-medium leading-tight">{title}</div>
			</section>
		</div>
	);
}
