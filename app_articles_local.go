package main

import (
	"fmt"
	"log"
)

// Fetch article by ID, CID or URL
func (a *App) FetchLocalArticle(idOrCIDOrURL string) string {
	url := fmt.Sprintf("%s/articles/local/full?id=%s", GetNodeBaseUrl(), idOrCIDOrURL)
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching local article: %v", err)
		return fmt.Sprintf("Error fetching local article: %v", err)
	}
	return body
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
