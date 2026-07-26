package models

import "time"

type User struct {
	ID        string    `json:"id"`
	PhoneNumber string    `json:"phone_number"`
	Email     string    `json:"email"`
	Role      string    `json:"role"` // admin, user
	Balance   int64     `json:"balance"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LoginRequest struct {
	PhoneNumber string `json:"phone_number"`
	Password    string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
