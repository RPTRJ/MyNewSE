package controller

import (
	"errors"

	"github.com/gin-gonic/gin"
)

func getAuthUserID(ctx *gin.Context) (uint, error) {
	v, ok := ctx.Get("user_id")
	if !ok {
		return 0, errors.New("missing auth user_id in context")
	}

	switch id := v.(type) {
	case uint:
		if id > 0 {
			return id, nil
		}
	case int:
		if id > 0 {
			return uint(id), nil
		}
	}

	return 0, errors.New("invalid auth user_id in context")
}
