package queue

import (
	"context"
	"sync"
	"time"

	"github.com/island/sms-panel/internal/trace"
)

type JobKind string

const (
	JobSendSMS JobKind = "send_sms"
)

type Job struct {
	ID         string
	Kind       JobKind
	CampaignID string
	Payload    map[string]string
	Attempts   int
	RunAt      time.Time
}

type Handler func(ctx context.Context, job Job) error

type Queue struct {
	log     *trace.Hub
	mu      sync.Mutex
	pending []Job
	handler Handler
	stop    chan struct{}
	wg      sync.WaitGroup
}

func NewMemory(log *trace.Hub) *Queue {
	return &Queue{
		log:  log,
		stop: make(chan struct{}),
	}
}

func (q *Queue) SetHandler(h Handler) {
	q.handler = h
}

func (q *Queue) Enqueue(job Job) {
	if job.RunAt.IsZero() {
		job.RunAt = time.Now()
	}
	q.mu.Lock()
	q.pending = append(q.pending, job)
	q.mu.Unlock()
	q.log.Step("queue", "کار در صف درون‌حافظه قرار گرفت: "+string(job.Kind))
}

func (q *Queue) Start(ctx context.Context) {
	q.wg.Add(1)
	go func() {
		defer q.wg.Done()
		ticker := time.NewTicker(500 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-q.stop:
				return
			case <-ticker.C:
				q.drain(ctx)
			}
		}
	}()
}

func (q *Queue) Stop() {
	close(q.stop)
	q.wg.Wait()
}

func (q *Queue) drain(ctx context.Context) {
	q.mu.Lock()
	if len(q.pending) == 0 {
		q.mu.Unlock()
		return
	}
	var ready []Job
	var rest []Job
	now := time.Now()
	for _, j := range q.pending {
		if !j.RunAt.After(now) {
			ready = append(ready, j)
		} else {
			rest = append(rest, j)
		}
	}
	q.pending = rest
	q.mu.Unlock()

	if q.handler == nil {
		return
	}
	for _, job := range ready {
		job := job
		if err := q.handler(ctx, job); err != nil {
			q.log.Error("queue", "اجرای کار ناموفق بود", err)
		}
	}
}
