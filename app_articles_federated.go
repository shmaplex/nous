package main

import (
	"fmt"
	"log"
)

// FetchFederatedArticles retrieves federated articles
func (a *App) FetchFederatedArticles() string {
	url := fmt.Sprintf("%s/articles/federated", GetNodeBaseUrl())
	body, err := get(url)
	if err != nil {
		log.Printf("Error fetching federated articles: %v", err)
		return fmt.Sprintf("Error fetching federated articles: %v", err)
	}
	return body
}

// SaveFederatedArticle stores a new federated article via HTTP
func (a *App) SaveFederatedArticle(article map[string]interface{}) string {
	url := fmt.Sprintf("%s/articles/federated/save", GetNodeBaseUrl())
	body, err := post(url, article)
	if err != nil {
		log.Printf("Error saving federated article: %v", err)
		return fmt.Sprintf("Error saving federated article: %v", err)
	}
	return body
}

// DeleteFederatedArticle removes a federated article by ID
func (a *App) DeleteFederatedArticle(id string) string {
	url := fmt.Sprintf("%s/articles/federated/delete/%s", GetNodeBaseUrl(), id)
	body, err := get(url)
	if err != nil {
		log.Printf("Error deleting federated article: %v", err)
		return fmt.Sprintf("Error deleting federated article: %v", err)
	}
	return body
}
