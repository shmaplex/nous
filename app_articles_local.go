package main

import (
	"encoding/json"
	"fmt"
	"log"
)

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

// SaveLocalArticle stores a new local article via HTTP
func (a *App) SaveLocalArticle(article map[string]interface{}) string {
	url := fmt.Sprintf("%s/articles/local/save", GetNodeBaseUrl())
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
