package util

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const adminJWTIssuer = "xiagu-admin"

// AdminClaims 管理员JWT Claims
type AdminClaims struct {
	AdminID  string `json:"admin_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAdminToken 生成管理员Token
func GenerateAdminToken(adminID, username, role, secret string) (string, error) {
	claims := AdminClaims{
		AdminID:  adminID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   adminID,
			Issuer:    adminJWTIssuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseAdminToken 解析管理员Token
func ParseAdminToken(tokenString, secret string) (*AdminClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	},
		jwt.WithValidMethods([]string{
			jwt.SigningMethodHS256.Alg(),
		}),
		jwt.WithIssuer(adminJWTIssuer),
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}
