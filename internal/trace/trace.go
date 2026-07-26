package trace

import (
	"encoding/json"
	"sync"
	"time"
)

type Level string

const (
	LevelInfo  Level = "info"
	LevelStep  Level = "step"
	LevelOK    Level = "ok"
	LevelWarn  Level = "warn"
	LevelError Level = "error"
)

type Entry struct {
	ID        string    `json:"id"`
	Time      time.Time `json:"time"`
	Level     Level     `json:"level"`
	Module    string    `json:"module"`
	Message   string    `json:"message"`
	Detail    string    `json:"detail,omitempty"`
	ErrorText string    `json:"error,omitempty"`
}

type Hub struct {
	mu      sync.RWMutex
	entries []Entry
	max     int
	subs    map[chan Entry]struct{}
}

func NewHub(max int) *Hub {
	if max <= 0 {
		max = 500
	}
	return &Hub{
		entries: make([]Entry, 0, 64),
		max:     max,
		subs:    make(map[chan Entry]struct{}),
	}
}

func (h *Hub) Subscribe(buf int) chan Entry {
	if buf <= 0 {
		buf = 32
	}
	ch := make(chan Entry, buf)
	h.mu.Lock()
	h.subs[ch] = struct{}{}
	for _, e := range h.entries {
		select {
		case ch <- e:
		default:
		}
	}
	h.mu.Unlock()
	return ch
}

func (h *Hub) Unsubscribe(ch chan Entry) {
	h.mu.Lock()
	delete(h.subs, ch)
	h.mu.Unlock()
	close(ch)
}

func (h *Hub) publish(e Entry) {
	h.mu.Lock()
	h.entries = append(h.entries, e)
	if len(h.entries) > h.max {
		h.entries = h.entries[len(h.entries)-h.max:]
	}
	subs := make([]chan Entry, 0, len(h.subs))
	for ch := range h.subs {
		subs = append(subs, ch)
	}
	h.mu.Unlock()

	for _, ch := range subs {
		select {
		case ch <- e:
		default:
		}
	}
}

func (h *Hub) Log(level Level, module, message, detail, errText string) Entry {
	e := Entry{
		ID:        time.Now().Format("20060102150405.000000"),
		Time:      time.Now(),
		Level:     level,
		Module:    module,
		Message:   message,
		Detail:    detail,
		ErrorText: errText,
	}
	h.publish(e)
	return e
}

func (h *Hub) Step(module, message string) Entry {
	return h.Log(LevelStep, module, message, "", "")
}

func (h *Hub) Info(module, message string) Entry {
	return h.Log(LevelInfo, module, message, "", "")
}

func (h *Hub) OK(module, message string) Entry {
	return h.Log(LevelOK, module, message, "", "")
}

func (h *Hub) Warn(module, message, detail string) Entry {
	return h.Log(LevelWarn, module, message, detail, "")
}

func (h *Hub) Error(module, message string, err error) Entry {
	errText := ""
	if err != nil {
		errText = err.Error()
	}
	return h.Log(LevelError, module, message, "", errText)
}

func (h *Hub) Snapshot(limit int) []Entry {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if limit <= 0 || limit > len(h.entries) {
		limit = len(h.entries)
	}
	start := len(h.entries) - limit
	if start < 0 {
		start = 0
	}
	out := make([]Entry, limit)
	copy(out, h.entries[start:])
	return out
}

func (e Entry) JSONLine() string {
	b, _ := json.Marshal(e)
	return string(b)
}
