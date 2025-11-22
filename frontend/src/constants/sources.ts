import type { Source } from "@/types";

export const DEFAULT_SOURCES: Source[] = [
	{
		name: "NewsAPI",
		url: "https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_KEY",
		instructions: "Sign up for a free API key at NewsAPI and replace YOUR_KEY",
		apiLink: "https://newsapi.org/docs/endpoints/top-headlines",
	},
	{
		name: "GDELT",
		url: "https://api.gdeltproject.org/api/v2/doc/doc?query=&mode=artlist&format=json",
		instructions: "No API key required; returns JSON feed appropriate fields.",
		apiLink: "https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/",
	},
	{
		name: "The Guardian Open Platform",
		url: "https://content.guardianapis.com/search?api-key=YOUR_KEY",
		instructions: "Requires free API key from The Guardian Open Platform",
		apiLink: "https://open-platform.theguardian.com/documentation/",
	},
	{
		name: "New York Times Top Stories",
		url: "https://api.nytimes.com/svc/topstories/v2/home.json?api-key=YOUR_KEY",
		instructions: "Requires free API key from NYT Developer Portal",
		apiLink: "https://developer.nytimes.com/apis",
	},
	{
		name: "Reddit /r/news JSON",
		url: "https://www.reddit.com/r/news/.json",
		instructions: "Public JSON feed, no API key required; rate‑limits apply",
		apiLink: "https://www.reddit.com/dev/api/",
	},
	{
		name: "BBC News RSS",
		url: "http://feeds.bbci.co.uk/news/rss.xml",
		instructions: "RSS feed, no API key required",
	},
	{
		name: "CNN RSS",
		url: "http://rss.cnn.com/rss/edition.rss",
		instructions: "RSS feed, no API key required",
	},
	{
		name: "Financial Times RSS",
		url: "https://www.ft.com/?format=rss",
		instructions: "RSS feed, no API key required (FT may require subscription)",
	},
	{
		name: "Al Jazeera All News RSS",
		url: "https://www.aljazeera.com/xml/rss/all.xml",
		instructions: "RSS feed, no API key required",
	},
	{
		name: "Reuters Top News RSS",
		url: "http://feeds.reuters.com/reuters/topNews",
		instructions: "RSS feed, no API key required",
	},
];
