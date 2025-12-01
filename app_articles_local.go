package main

import (
	"encoding/json"
	"fmt"
	"log"
)

func failResponse(msg string) string {
	log.Println(msg)
	res := APIResponse{
		Success: false,
		Error:   msg,
		Data:    nil,
	}
	resJSON, _ := json.Marshal(res)
	return string(resJSON)
}

// Helper to convert identifiers to []string without validation
func identifiersToStrings(identifiers interface{}) []string {
	var result []string
	switch v := identifiers.(type) {
	case string:
		result = []string{v}
	case []interface{}:
		for _, id := range v {
			if strID, ok := id.(string); ok {
				result = append(result, strID)
			} else {
				result = append(result, fmt.Sprintf("%v", id))
			}
		}
	case []string:
		result = v
	default:
		log.Printf("Unexpected identifier type: %#v", identifiers)
	}
	return result
}

func (a *App) TranslateArticle(identifiers interface{}, targetLanguage string, keys []string, overwrite bool) string {
	// Force keys default if nil/empty
	if len(keys) == 0 {
		keys = []string{"title"}
	}

	// Build request body directly
	reqBody := TranslationRequest{
		Identifiers:    identifiersToStrings(identifiers),
		TargetLanguage: targetLanguage,
		Keys:           keys,
		Overwrite:      overwrite,
	}

	url := fmt.Sprintf("%s/articles/local/translate", GetNodeBaseUrl())
	body, err := post(url, reqBody)
	if err != nil {
		log.Printf("Error translating articles: %v", err)
		return failResponse(fmt.Sprintf("Error translating articles: %v", err))
	}

	var res APIResponse
	if err := json.Unmarshal([]byte(body), &res); err != nil {
		log.Printf("Error parsing translation response: %v", err)
		return failResponse(fmt.Sprintf("Error parsing translation response: %v", err))
	}

	resJSON, _ := json.Marshal(res)
	return string(resJSON)
}

// FetchLocalArticle fetches by ID/URL/CID and returns immediately
func (a *App) FetchLocalArticle(idOrCIDOrURL string) string {
	// Call your internal fetch, e.g., database or cache
	url := fmt.Sprintf("%s/articles/local/full?id=%s", GetNodeBaseUrl(), idOrCIDOrURL)
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching local article: %v", err)
		status := ArticleStatus{
			ID:       idOrCIDOrURL,
			Status:   "error",
			ErrorMsg: err.Error(),
		}
		res, _ := json.Marshal(status)
		return string(res)
	}

	// Check if processing is complete
	var article map[string]interface{}
	if err := json.Unmarshal([]byte(body), &article); err != nil || article["content"] == nil {
		// Article not fully processed
		status := ArticleStatus{
			ID:     idOrCIDOrURL,
			Status: "pending",
		}
		res, _ := json.Marshal(status)
		return string(res)
	}

	// Fully processed
	status := ArticleStatus{
		ID:     idOrCIDOrURL,
		Status: "complete",
		Body:   body,
	}
	res, _ := json.Marshal(status)
	return string(res)
}

// FetchLocalArticles retrieves only local articles from the HTTP service
func (a *App) FetchLocalArticles() string {
	url := fmt.Sprintf("%s/articles/local", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching local articles: %v", err)
		return fmt.Sprintf("Error fetching local articles: %v", err)
	}
	return body
}

// SaveLocalArticle stores a new local article via HTTP, optionally overwriting existing articles
func (a *App) SaveLocalArticle(article map[string]interface{}, overwrite bool) string {
	// Add overwrite flag as a query param
	url := fmt.Sprintf("%s/articles/local/save?overwrite=%t", GetNodeBaseUrl(), overwrite)

	body, err := post(url, article)
	if err != nil {
		log.Printf("Error saving local article: %v", err)
		return fmt.Sprintf("Error saving local article: %v", err)
	}
	return body
}

// DeleteLocalArticle removes a local article by ID
func (a *App) DeleteLocalArticle(id string) string {
	url := fmt.Sprintf("%s/articles/local/delete/%s", GetNodeBaseUrl(), id)
	body, err := get(url)
	if err != nil {
		log.Printf("Error deleting local article: %v", err)
		return fmt.Sprintf("Error deleting local article: %v", err)
	}
	return body
}
