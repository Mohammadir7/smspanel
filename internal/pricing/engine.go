package pricing

import "sync"

// Simple dynamic pricing — admin UI will replace hardcoded defaults later.
type Engine struct {
	mu              sync.RWMutex
	pricePerPartRial int
}

func NewEngine(defaultPrice int) *Engine {
	if defaultPrice <= 0 {
		defaultPrice = 250
	}
	return &Engine{pricePerPartRial: defaultPrice}
}

func (e *Engine) PricePerPart() int {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.pricePerPartRial
}

func (e *Engine) SetPricePerPart(p int) {
	e.mu.Lock()
	e.pricePerPartRial = p
	e.mu.Unlock()
}
