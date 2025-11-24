package main

import (
	"fmt"
	"log"
)

// FetchArticles retrieves all articles from the HTTP service
func (a *App) FetchArticles() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/articles/sources", instanceHTTPPort()))
	if err != nil {
		log.Printf("Error fetching articles: %v", err)
		return fmt.Sprintf("Error fetching articles: %v", err)
	}
	return body
}

// FetchLocalArticles retrieves only local articles
func (a *App) FetchLocalArticles() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/articles/local", instanceHTTPPort()))
	if err != nil {
		log.Printf("Error fetching local articles: %v", err)
		return fmt.Sprintf("Error fetching local articles: %v", err)
	}
	return body
}

// FetchAnalyzedArticles retrieves only AI-analyzed articles
func (a *App) FetchAnalyzedArticles() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/articles/analyzed", instanceHTTPPort()))
	if err != nil {
		log.Printf("Error fetching analyzed articles: %v", err)
		return fmt.Sprintf("Error fetching analyzed articles: %v", err)
	}
	return body
}

// FetchFederatedArticles retrieves only federated articles
func (a *App) FetchFederatedArticles() string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/articles/federated", instanceHTTPPort()))
	if err != nil {
		log.Printf("Error fetching federated articles: %v", err)
		return fmt.Sprintf("Error fetching federated articles: %v", err)
	}
	return body
}

// SaveArticle stores a new article via HTTP
func (a *App) SaveArticle(title, url, content, edition string) string {
	data := map[string]string{
		"title":   title,
		"url":     url,
		"content": content,
	}
	if edition != "" {
		data["edition"] = edition
	}

	body, err := post(fmt.Sprintf("http://127.0.0.1:%d/save", instanceHTTPPort()), data)
	if err != nil {
		log.Printf("Error saving article: %v", err)
		return fmt.Sprintf("Error saving article: %v", err)
	}
	return body
}

// DeleteArticle removes an article by ID
func (a *App) DeleteArticle(id string) string {
	body, err := get(fmt.Sprintf("http://127.0.0.1:%d/delete/%s", instanceHTTPPort(), id))
	if err != nil {
		log.Printf("Error deleting article: %v", err)
		return fmt.Sprintf("Error deleting article: %v", err)
	}
	return body
}
