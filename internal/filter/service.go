package filter

import (
	"strings"
)

var BlockedWords = []string{
	"کلمه_نمونه_ممنوع",
	"کلمه_نامناسب",
}

type FilterService struct{}

// NewFilterService creates a new filter service
func NewFilterService() *FilterService {
	return &FilterService{}
}

// FilterMessage filters a message for blocked words
func (f *FilterService) FilterMessage(message string) (bool, string) {
	lowerMsg := strings.ToLower(message)

	for _, word := range BlockedWords {
		if strings.Contains(lowerMsg, strings.ToLower(word)) {
			return false, "پیام شامل کلمات ممنوع است"
		}
	}

	return true, ""
}
