package services

import (
	"errors"
	"os"
	"strconv"
	"time"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

type AuthService struct {
	db         *gorm.DB
	jwtWrapper *JWTWrapper
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{
		db:         db,
		jwtWrapper: NewJWTWrapper(),
	}
}

func (s *AuthService) Authenticate(email, password string) (*entity.User, error) {
	var user entity.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !config.CheckPasswordHash(password, user.Password) {
		return nil, ErrInvalidCredentials
	}

	return &user, nil
}

func (s *AuthService) Register(user *entity.User) (*entity.User, error) {
	var existing entity.User
	if err := s.db.Where("email = ?", user.Email).First(&existing).Error; err == nil {
		return nil, errors.New("email already in use")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) GenerateToken(user *entity.User) (string, error) {
	return s.jwtWrapper.GenerateToken(user)
}

// JWT helper logic
type JWTWrapper struct {
	SecretKey       string
	Issuer          string
	ExpirationHours int64
}

type JWTClaim struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.StandardClaims
}

func NewJWTWrapper() *JWTWrapper {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "very-secret"
	}

	issuer := os.Getenv("JWT_ISSUER")
	if issuer == "" {
		issuer = "auth-service"
	}

	exp := int64(24)
	if envExp := os.Getenv("JWT_EXPIRE_HOURS"); envExp != "" {
		if parsed, err := strconv.ParseInt(envExp, 10, 64); err == nil && parsed > 0 {
			exp = parsed
		}
	}

	return &JWTWrapper{
		SecretKey:       secret,
		Issuer:          issuer,
		ExpirationHours: exp,
	}
}

func (j *JWTWrapper) GenerateToken(user *entity.User) (string, error) {
	if user == nil {
		return "", errors.New("user is required")
	}

	expiration := time.Now().Add(time.Duration(j.ExpirationHours) * time.Hour)
	claims := JWTClaim{
		UserID: user.ID,
		Email:  user.Email,
		StandardClaims: jwt.StandardClaims{
			Issuer:    j.Issuer,
			ExpiresAt: expiration.Unix(),
			Subject:   "user_auth",
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.SecretKey))
}

func (j *JWTWrapper) ValidateToken(signedToken string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&JWTClaim{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(j.SecretKey), nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
