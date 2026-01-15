package controller

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)


type ScoreCriteriaController struct {
	DB *gorm.DB
}

func (c *ScoreCriteriaController) Create(ctx *gin.Context) {
	var criteria entity.ScoreCriteria
	if err := ctx.ShouldBindJSON(&criteria); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.DB.Create(&criteria).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, criteria)
}

func (c *ScoreCriteriaController) GetAll(ctx *gin.Context) {
	var criteria []entity.ScoreCriteria
	if err := c.DB.Preload("Scorecard").Find(&criteria).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, criteria)
}

func (c *ScoreCriteriaController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var criteria entity.ScoreCriteria
	if err := c.DB.Preload("Scorecard").First(&criteria, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, criteria)
}