// frontend/src/components/articles/similar-news-topics.tsx
import { Plus } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";

/**
 * Represents a single similar news topic.
 */
export interface SimilarTopic {
	/** Unique identifier for the topic */
	id: string;
	/** Display name of the topic */
	name: string;
	/** Link to the topic page */
	href: string;
	/** URL to the topic icon */
	iconUrl: string;
}

/**
 * Props for the SimilarNewsTopics component
 */
interface Props {
	/** Array of topics to display. If not provided, placeholder topics are shown */
	topics?: SimilarTopic[];
}

const placeholderTopics: SimilarTopic[] = [
	{
		id: "placeholder-1",
		name: "Global Politics",
		href: "/interest/global-politics",
		iconUrl: "https://placehold.co/48x48?text=G",
	},
	{
		id: "placeholder-2",
		name: "Economy",
		href: "/interest/economy",
		iconUrl: "https://placehold.co/48x48?text=E",
	},
	{
		id: "placeholder-3",
		name: "Climate",
		href: "/interest/climate",
		iconUrl: "https://placehold.co/48x48?text=C",
	},
	{
		id: "placeholder-4",
		name: "Technology",
		href: "/interest/technology",
		iconUrl: "https://placehold.co/48x48?text=T",
	},
	{
		id: "placeholder-5",
		name: "Asia-Pacific",
		href: "/interest/asia-pacific",
		iconUrl: "https://placehold.co/48x48?text=A",
	},
];

/**
 * Component to display a list of similar news topics with icons and action buttons.
 * Only visible on large screens (lg breakpoint).
 */
const SimilarNewsTopics: React.FC<Props> = ({ topics }) => {
	const items = topics && topics.length > 0 ? topics : placeholderTopics;

	return (
		<div className="hidden lg:block">
			<div className="flex flex-col gap-6">
				<h3 className="text-32 leading-14 font-extrabold">Similar News Topics</h3>

				{items.map((topic) => (
					<div key={topic.id} className="flex justify-between items-center cursor-pointer">
						<div className="flex justify-between pr-[1.3rem] text-18 overflow-hidden">
							<a
								id={`trending-topic_${topic.id}`}
								href={topic.href}
								className="flex items-center gap-4 cursor-pointer max-w-full"
							>
								<img
									src={topic.iconUrl}
									alt={`${topic.name} icon`}
									width={48}
									height={48}
									className="rounded-full object-cover aspect-square shrink-0"
								/>
								<p className="text-18 truncate">{topic.name}</p>
							</a>
						</div>

						<div className="text-16">
							<Button variant="ghost" size="icon" className="mt-1 w-8 flex justify-center">
								<Plus className="w-4 h-4" />
							</Button>
						</div>
					</div>
				))}

				<div className="flex text-18 w-full justify-center mt-4">
					<a href="/discover">
						<Button className="px-[0.7rem] py-2 font-bold rounded-[4px] text-16 leading-9 whitespace-nowrap border border-dark-primary text-dark-primary dark:border-light-primary dark:text-light-primary hover:text-light-heavy active:text-light-heavy disabled:opacity-50">
							Show All
						</Button>
					</a>
				</div>
			</div>
		</div>
	);
};

export default SimilarNewsTopics;
