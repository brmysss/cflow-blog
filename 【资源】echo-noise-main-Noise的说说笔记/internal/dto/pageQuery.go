package dto

import (
	"github.com/lin-snow/ech0/internal/models"
)

type PageQueryDto struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
}

type PageQueryResult struct {
	Total int64            `json:"total"`
	Items []models.Message `json:"items"`
}
