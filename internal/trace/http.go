package trace

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

func (h *Hub) RegisterRoutes(mux interface {
	Get(pattern string, handlerFn http.HandlerFunc)
}) {
	mux.Get("/api/v1/trace/stream", h.handleSSE)
	mux.Get("/api/v1/trace/history", h.handleHistory)
}

func (h *Hub) handleHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"entries": h.Snapshot(200),
	})
}

func (h *Hub) handleSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := h.Subscribe(64)
	defer h.Unsubscribe(ch)

	fmt.Fprintf(w, "event: connected\ndata: {\"message\":\"اتصال ردیاب مراحل برقرار شد\"}\n\n")
	flusher.Flush()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case e, open := <-ch:
			if !open {
				return
			}
			b, err := json.Marshal(e)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "event: trace\ndata: %s\n\n", b)
			flusher.Flush()
		case <-time.After(25 * time.Second):
			fmt.Fprintf(w, ": ping\n\n")
			flusher.Flush()
		}
	}
}
