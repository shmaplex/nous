package main

import (
	"fmt"
	"log"
)

// FetchAnalyzedArticles retrieves AI-analyzed articles
func (a *App) FetchAnalyzedArticles() string {
	url := fmt.Sprintf("%s/articles/analyzed", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching analyzed articles: %v", err)
		return fmt.Sprintf("Error fetching analyzed articles: %v", err)
	}
	return body
}

// SaveAnalyzedArticle stores a new analyzed article via HTTP
func (a *App) SaveAnalyzedArticle(article map[string]interface{}) string {
	url := fmt.Sprintf("%s/articles/analyzed/save", GetNodeBaseUrl())
	body, err := post(url, article)
	if err != nil {
		log.Printf("Error saving analyzed article: %v", err)
		return fmt.Sprintf("Error saving analyzed article: %v", err)
	}
	return body
}

// DeleteAnalyzedArticle removes an analyzed article by ID
func (a *App) DeleteAnalyzedArticle(id string) string {
	url := fmt.Sprintf("%s/articles/analyzed/delete/%s", GetNodeBaseUrl(), id)
	body, err := get(url)
	if err != nil {
		log.Printf("Error deleting analyzed article: %v", err)
		return fmt.Sprintf("Error deleting analyzed article: %v", err)
	}
	return body
}
