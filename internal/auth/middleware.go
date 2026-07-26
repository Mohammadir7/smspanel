package auth

import (
	"net/http"
	"strings"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(authService *AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			token, err := ExtractTokenFromHeader(authHeader)
			if err != nil {
				http.Error(w, `{"error":"invalid authorization header"}`, http.StatusUnauthorized)
				return
			}

			claims, err := authService.VerifyToken(token)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			// Store claims in context for handler to use
			ctx := r.Context()
			ctx = setUserClaims(ctx, claims)
		
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserClaims retrieves claims from context
func GetUserClaims(r *http.Request) *Claims {
	claims, ok := r.Context().Value("claims").(*Claims)
	if !ok {
		return nil
	}
	return claims
}

func setUserClaims(ctx *http.Request.Context, claims *Claims) *http.Request.Context {
	return context.WithValue(ctx, "claims", claims)
}
