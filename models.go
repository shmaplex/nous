// models.go
package main

// ----------------------
// Source Metadata
// ----------------------

// SourceMeta represents metadata about a news source, including bias and confidence.
// Used for enriching article analysis.
type SourceMeta struct {
	Name       string   `json:"name"`                 // Name of the source, e.g., "CBS News"
	Bias       string   `json:"bias"`                 // Political/ideological leaning: "left", "center", "right"
	Confidence *float64 `json:"confidence,omitempty"` // Confidence score in bias classification (0-1)
}

// ----------------------
// Source Definition
// ----------------------

// Source represents a content or news source with optional metadata for ingestion.
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
	LastUpdated     interface{}       `json:"lastUpdated,omitempty"`        // Optional string or timestamp of last update
	Pinned          *bool             `json:"pinned,omitempty"`             // Optional flag for pinned sources
}

// ----------------------
// Article Editions
// ----------------------

// Edition represents regional or language editions for articles.
type Edition string

const (
	EditionInternational Edition = "international"
	EditionUS            Edition = "us"
	EditionUK            Edition = "uk"
	EditionKR            Edition = "kr"
	EditionCN            Edition = "cn"
	EditionOther         Edition = "other"
	// Add more editions as needed
)

// ----------------------
// Federated Article Pointer
// ----------------------

// FederatedArticlePointer is a minimal pointer to an article stored in a federated network or IPFS.
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

// Article represents a news article, potentially not yet analyzed.
type Article struct {
	ID          string      `json:"id"`                    // Unique identifier (hash, UUID)
	Title       string      `json:"title"`                 // Article title
	URL         string      `json:"url"`                   // Fully qualified URL
	Content     *string     `json:"content,omitempty"`     // Full content
	Summary     *string     `json:"summary,omitempty"`     // Optional short summary
	Image       *string     `json:"image,omitempty"`       // Primary image URL
	Categories  []string    `json:"categories,omitempty"`  // Optional categories
	Tags        []string    `json:"tags,omitempty"`        // Optional tags
	Language    *string     `json:"language,omitempty"`    // ISO 639-1 language code
	Author      *string     `json:"author,omitempty"`      // Optional author
	PublishedAt *string     `json:"publishedAt,omitempty"` // Optional ISO timestamp
	Edition     *Edition    `json:"edition,omitempty"`     // Optional regional edition
	Analyzed    bool        `json:"analyzed"`              // False until analyzed
	IPFSHash    *string     `json:"ipfsHash,omitempty"`    // Optional IPFS content hash
	Raw         interface{} `json:"raw,omitempty"`         // Optional raw feed or debug info
	SourceMeta  *SourceMeta `json:"sourceMeta,omitempty"`  // Optional metadata about the source
}

// ----------------------
// Analyzed Article
// ----------------------

// CognitiveBias represents a detected cognitive bias in an article.
type CognitiveBias struct {
	Bias        string  `json:"bias"`                  // Name of the bias
	Snippet     string  `json:"snippet"`               // Text snippet showing the bias
	Explanation string  `json:"explanation"`           // Short explanation
	Severity    string  `json:"severity"`              // "low", "medium", "high"
	Description *string `json:"description,omitempty"` // Optional full description
	Category    *string `json:"category,omitempty"`    // Optional category
}

// ArticleAnalyzed represents a fully analyzed article with AI-enriched fields.
type ArticleAnalyzed struct {
	Article                           // Embed base Article
	PoliticalBias     *string         `json:"politicalBias,omitempty"`     // Optional political/ideological bias
	Antithesis        *string         `json:"antithesis,omitempty"`        // Concise summary of opposing viewpoints
	Philosophical     *string         `json:"philosophical,omitempty"`     // Optional philosophical interpretation
	Sentiment         *string         `json:"sentiment,omitempty"`         // e.g., positive/negative/neutral
	CognitiveBiases   []CognitiveBias `json:"cognitiveBiases,omitempty"`   // Array of detected biases
	Confidence        *float64        `json:"confidence,omitempty"`        // Confidence of analysis (0-1)
	AnalysisTimestamp *string         `json:"analysisTimestamp,omitempty"` // When analysis was performed
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
