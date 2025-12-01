package main

// ----------------------
// API Response Wrapper
// ----------------------

// APIResponse is a standard wrapper for all responses sent by the backend API.
//
// It ensures every response indicates success/failure and optionally carries
// either an error message or the requested data payload.
//
// Example JSON:
//
//	{
//	  "success": true,
//	  "error": "",
//	  "data": {...}
//	}
type APIResponse struct {
	Success bool        `json:"success"`         // True if the operation succeeded, false otherwise
	Error   string      `json:"error,omitempty"` // Optional error message when Success is false
	Data    interface{} `json:"data,omitempty"`  // Optional payload for successful responses
}

// ----------------------
// Debug Log Entry
// ----------------------

// DebugLogEntry represents a single log entry in the P2P debug log database.
//
// Each entry includes a unique ID, timestamp, message, log level, and optional metadata.
// These entries are stored in OrbitDB (or similar) and are intended for debugging
// and operational tracing of the P2P node.
//
// Example JSON:
//
//	{
//	  "_id": "uuid",
//	  "timestamp": "2025-11-26T09:36:11.340Z",
//	  "message": "Node debug DB initialized",
//	  "level": "info",
//	  "meta": { "port": "9001" }
//	}
type DebugLogEntry struct {
	ID        string                 `json:"_id"`            // Unique identifier for the log entry (UUID recommended)
	Timestamp string                 `json:"timestamp"`      // ISO 8601 timestamp of when the entry was created
	Message   string                 `json:"message"`        // Human-readable log message
	Level     string                 `json:"level"`          // Log level: "info", "warn", or "error"
	Meta      map[string]interface{} `json:"meta,omitempty"` // Optional metadata, e.g., port number, type, or context info
}

// ----------------------
// Source Metadata
// ----------------------

// SourceMeta holds basic information about a source and its bias.
// - Name: the human-readable source name
// - Bias: political or ideological bias (e.g., "left", "right", "neutral")
// - Confidence: optional confidence score in bias assessment (0-1)
type SourceMeta struct {
	Name       string   `json:"name"`                 // Name of the source, e.g., "CBS News"
	Bias       string   `json:"bias"`                 // Political/ideological leaning: "left", "center", "right"
	Confidence *float64 `json:"confidence,omitempty"` // Confidence score in bias classification (0-1)
}

// ----------------------
// Source Definition
// ----------------------

// Source defines a data source for articles, including endpoints, auth, and metadata.
// - Parser / Normalizer: define how the data is processed and normalized
// - Bias / Factuality: optional bias and factuality scoring
// - Ownership: company or organization ownership info
type Source struct {
	Name            string            `json:"name"`                         // Name of the source (e.g., "BBC News")
	Endpoint        string            `json:"endpoint"`                     // API or RSS endpoint URL
	APIKey          *string           `json:"apiKey,omitempty"`             // Optional API key provided by the user
	Instructions    *string           `json:"instructions,omitempty"`       // Optional instructions for using the source
	APILink         *string           `json:"apiLink,omitempty"`            // Optional link to API docs
	Enabled         *bool             `json:"enabled,omitempty"`            // Optional flag indicating if source is active
	RequiresAPIKey  *bool             `json:"requiresApiKey,omitempty"`     // Optional flag for API key requirement
	Category        *string           `json:"category,omitempty"`           // Optional source category (e.g., news, blog, rss)
	Tags            []string          `json:"tags,omitempty"`               // Optional array of tags
	Language        *string           `json:"language,omitempty"`           // Optional ISO 639-1 language code
	Region          *string           `json:"region,omitempty"`             // Optional region code
	AuthType        *string           `json:"authType,omitempty"`           // Optional auth type: none, apiKey, bearerToken, oauth, etc.
	RateLimitPerMin *int              `json:"rateLimitPerMinute,omitempty"` // Optional rate limit
	Headers         map[string]string `json:"headers,omitempty"`            // Optional custom headers
	LastUpdated     *string           `json:"lastUpdated,omitempty"`
	Pinned          *bool             `json:"pinned,omitempty"`

	// Parser & Normalizer
	Parser     string `json:"parser"`     // defaults to "json"
	Normalizer string `json:"normalizer"` // defaults to "json"

	// Bias / Factuality
	Bias       string   `json:"bias,omitempty"`
	Factuality *string  `json:"factuality,omitempty"`
	Confidence *float64 `json:"confidence,omitempty"`

	// Ownership info
	Ownership *Ownership `json:"ownership,omitempty"`

	// Last fetched timestamp
	LastFetched *string `json:"lastFetched,omitempty"`
}

// ----------------------
// Ownership Schema
// ----------------------

// Ownership represents the owner organization of a source.
// - CompanyName: official organization name
// - Type: type of organization (private, government, NGO, etc.)
// - Country: optional country code
type Ownership struct {
	CompanyName string  `json:"companyName"`
	Type        string  `json:"type"` // private, government, ngo, etc.
	Country     *string `json:"country,omitempty"`
}

// ----------------------
// Article Editions
// ----------------------

// Edition defines the regional or contextual edition of an article.
type Edition string

const (
	EditionInternational Edition = "international"
	EditionUS            Edition = "us"
	EditionUK            Edition = "uk"
	EditionKR            Edition = "kr"
	EditionCN            Edition = "cn"
	EditionOther         Edition = "other"
)

// ----------------------
// Federated Article Pointer
// ----------------------

// FederatedArticlePointer is a minimal representation of an article shared across nodes.
// - CID: IPFS Content Identifier for fetching full content
// - Timestamp: creation or last update of the pointer
// - Hash: optional content hash for verification
// - Analyzed: true if this article has been analyzed
// - Source / Edition: optional metadata
type FederatedArticlePointer struct {
	CID       string  `json:"cid"`               // Content Identifier (IPFS)
	Timestamp string  `json:"timestamp"`         // ISO timestamp of creation/update
	Hash      *string `json:"hash,omitempty"`    // Optional content hash
	Analyzed  bool    `json:"analyzed"`          // True if article was analyzed
	Source    *string `json:"source,omitempty"`  // Optional source name
	Edition   *string `json:"edition,omitempty"` // Optional edition/region
}

// ----------------------
// Raw Article (Ingested)
// ----------------------

// Article represents a raw article before analysis, including minimal metadata.
// - ID, Title, URL: required identifiers
// - Content, Summary, Image: optional media and text fields
// - Categories / Tags: optional classification
// - SourceMeta: optional bias/factuality metadata
type Article struct {
	ID            string      `json:"id"`                    // Unique identifier (hash, UUID)
	Title         string      `json:"title"`                 // Article title
	URL           string      `json:"url"`                   // Fully qualified URL
	Content       *string     `json:"content,omitempty"`     // Full content
	Summary       *string     `json:"summary,omitempty"`     // Optional short summary
	Image         *string     `json:"image,omitempty"`       // Primary image URL
	Categories    []string    `json:"categories,omitempty"`  // Optional categories
	Tags          []string    `json:"tags,omitempty"`        // Optional tags
	Language      *string     `json:"language,omitempty"`    // ISO 639-1 language code
	Author        *string     `json:"author,omitempty"`      // Optional author
	PublishedAt   *string     `json:"publishedAt,omitempty"` // Optional ISO timestamp
	Edition       *Edition    `json:"edition,omitempty"`     // Optional regional edition
	Analyzed      bool        `json:"analyzed"`              // False until analyzed
	IPFSHash      *string     `json:"ipfsHash,omitempty"`
	Raw           interface{} `json:"raw,omitempty"`
	SourceMeta    *SourceMeta `json:"sourceMeta,omitempty"`
	FetchedAt     *string     `json:"fetchedAt,omitempty"`
	Parser        string      `json:"parser"`     // frontend-compatible parser
	Normalizer    string      `json:"normalizer"` // frontend-compatible normalizer
	Confidence    *float64    `json:"confidence,omitempty"`
	MobileURL     *string     `json:"mobileUrl,omitempty"`
	Source        *string     `json:"source,omitempty"`
	SourceDomain  *string     `json:"sourceDomain,omitempty"`
	SourceType    *string     `json:"sourceType,omitempty"`
	SourceCountry *string     `json:"sourceCountry,omitempty"`
}

// ----------------------
// Analyzed Article
// ----------------------

// CognitiveBias represents one detected cognitive bias in an article.
type CognitiveBias struct {
	Bias        string  `json:"bias"`
	Snippet     string  `json:"snippet"`
	Explanation string  `json:"explanation"`
	Severity    string  `json:"severity"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
}

// ArticleAnalyzed extends Article with AI-enriched fields.
// - PoliticalBias: optional political/ideological classification
// - Antithesis / Philosophical: optional interpretative summaries
// - Sentiment: optional sentiment label and valence
// - CognitiveBiases: optional array of detected cognitive biases
// - ClickbaitLevel, CredibilityLevel, SubjectivityLevel: optional quality metrics
// - EmotionalPalette: optional dominant/secondary emotions
// - Readability: optional reading difficulty metrics
// - Trustworthiness: optional 1-5 score
// - AnalysisTimestamp: when analysis was performed
type ArticleAnalyzed struct {
	Article                          // Embed base Article
	PoliticalBias    *string         `json:"politicalBias,omitempty"`   // Optional political/ideological bias
	Antithesis       *string         `json:"antithesis,omitempty"`      // Concise summary of opposing viewpoints
	Philosophical    *string         `json:"philosophical,omitempty"`   // Optional philosophical interpretation
	Sentiment        *string         `json:"sentiment,omitempty"`       // e.g., positive/negative/neutral
	CognitiveBiases  []CognitiveBias `json:"cognitiveBiases,omitempty"` // Array of detected biases
	Confidence       *float64        `json:"confidence,omitempty"`      // Confidence of analysis (0-1)
	SentimentValence *float64        `json:"sentimentValence,omitempty"`
	ClickbaitLevel   *string         `json:"clickbaitLevel,omitempty"`
	CredibilityLevel *string         `json:"credibilityLevel,omitempty"`
	EmotionalPalette *struct {
		Dominant  string  `json:"dominant"`
		Secondary *string `json:"secondary,omitempty"`
	} `json:"emotionalPalette,omitempty"`
	Readability *struct {
		FleschEase   *float64 `json:"fleschEase,omitempty"`
		FleschGrade  *float64 `json:"fleschGrade,omitempty"`
		ReadingLevel *string  `json:"readingLevel,omitempty"`
	} `json:"readability,omitempty"`
	SubjectivityLevel *string  `json:"subjectivityLevel,omitempty"`
	Trustworthiness   *float64 `json:"trustworthiness,omitempty"`
	AnalysisTimestamp *string  `json:"analysisTimestamp,omitempty"`
}

// ArticlesResponse represents the standard response from the P2P HTTP API
// when fetching multiple articles from sources.
//
// The response wraps the list of articles in a success envelope to indicate
// whether the operation was successful, along with the actual articles array.
//
// Example JSON:
//
//	{
//	  "success": true,
//	  "articles": [
//	    { "id": "123", "title": "Example Article", "url": "https://example.com" },
//	    ...
//	  ]
//	}
type ArticlesResponse struct {
	Success  bool      `json:"success"`  // True if the fetch operation succeeded
	Articles []Article `json:"articles"` // Array of Article objects retrieved
}

// ArticlesBySource represents a collection of raw feed data grouped by source name.
//
// Each entry maps a source name to the raw response fetched from that source.
// The raw data can be JSON, XML, RSS, HTML, or any other format provided by the source.
// Parsing and normalization is intended to be handled by the Node/JS frontend.
//
// This structure allows the frontend to handle different formats per source,
// while Go focuses solely on fetching the data.
//
// Example:
//
//	{
//	  "BBC News": "<rss>...</rss>",
//	  "NY Times": "[{ \"id\": \"3\", \"title\": \"Article C\", \"url\": \"https://nytimes.com/c\" }]"
//
//	}
type ArticlesBySource map[string][]byte

// ArticleStatus represents the processing state of an article
type ArticleStatus struct {
	ID       string `json:"id"`
	Status   string `json:"status"`   // "pending" | "complete" | "error"
	Body     string `json:"body"`     // may be empty if pending
	ErrorMsg string `json:"errorMsg"` // optional
}

// TranslationRequest represents the request body for translating specified fields of articles
type TranslationRequest struct {
	Identifiers    []string `json:"identifiers"`    // Article URLs, internal IDs, or IPFS CIDs
	TargetLanguage string   `json:"targetLanguage"` // e.g., "en", "ko"
	Keys           []string `json:"keys,omitempty"` // Fields to translate, default ["title"]
	Overwrite      bool     `json:"overwrite"`      // Whether to overwrite existing translations
}
