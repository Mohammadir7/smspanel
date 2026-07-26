package filter

import (
	"strings"
	"sync"
)

type Engine struct {
	mu       sync.RWMutex
	blocked  []string
	maxParts int
}

func NewEngine(maxParts int) *Engine {
	if maxParts <= 0 {
		maxParts = 10
	}
	return &Engine{
		blocked:  []string{"کلمه_نمونه_ممنوع"},
		maxParts: maxParts,
	}
}

type Result struct {
	Allowed bool
	Reason  string
}

func (e *Engine) Check(message string, parts int) Result {
	e.mu.RLock()
	blocked := append([]string(nil), e.blocked...)
	maxP := e.maxParts
	e.mu.RUnlock()

	if parts > maxP {
		return Result{Allowed: false, Reason: "تعداد پارت پیام از حد مجاز بیشتر است"}
	}
	lower := strings.ToLower(message)
	for _, w := range blocked {
		if w == "" {
			continue
		}
		if strings.Contains(lower, strings.ToLower(w)) {
			return Result{Allowed: false, Reason: "متن شامل عبارت غیرمجاز است"}
		}
	}
	return Result{Allowed: true}
}

func (e *Engine) SetBlocked(words []string) {
	e.mu.Lock()
	e.blocked = words
	e.mu.Unlock()
}

func (e *Engine) ListBlocked() []string {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return append([]string(nil), e.blocked...)
}
