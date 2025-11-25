package main

import (
	"fmt"
	"log"
)

// FetchArticles retrieves all articles from the HTTP service
func (a *App) FetchArticles() string {
	url := fmt.Sprintf("%s/articles/sources", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching articles: %v", err)
		return fmt.Sprintf("Error fetching articles: %v", err)
	}
	return body
}

// FetchLocalArticles retrieves only local articles
func (a *App) FetchLocalArticles() string {
	url := fmt.Sprintf("%s/articles/local", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching local articles: %v", err)
		return fmt.Sprintf("Error fetching local articles: %v", err)
	}
	return body
}

// FetchAnalyzedArticles retrieves only AI-analyzed articles
func (a *App) FetchAnalyzedArticles() string {
	url := fmt.Sprintf("%s/articles/analyzed", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching analyzed articles: %v", err)
		return fmt.Sprintf("Error fetching analyzed articles: %v", err)
	}
	return body
}

// FetchFederatedArticles retrieves only federated articles
func (a *App) FetchFederatedArticles() string {
	url := fmt.Sprintf("%s/articles/federated", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching federated articles: %v", err)
		return fmt.Sprintf("Error fetching federated articles: %v", err)
	}
	return body
}

// SaveArticle stores a new article via HTTP
func (a *App) SaveArticle(article map[string]interface{}) string {
	baseUrl := fmt.Sprintf("%s/articles/save", GetNodeBaseUrl())

	// Send the entire article object to Node
	body, err := post(baseUrl, article)
	if err != nil {
		log.Printf("Error saving article: %v", err)
		return fmt.Sprintf("Error saving article: %v", err)
	}

	return body
}

// DeleteArticle removes an article by ID
func (a *App) DeleteArticle(id string) string {
	baseUrl := fmt.Sprintf("%s/articles/delete/%s", GetNodeBaseUrl(), id)
	body, err := get(baseUrl)
	if err != nil {
		log.Printf("Error deleting article: %v", err)
		return fmt.Sprintf("Error deleting article: %v", err)
	}
	return body
}
