package models

import (
    "sync"
    "gorm.io/gorm"
)

var (
    db   *gorm.DB
    lock sync.RWMutex
)

// SetDB 设置数据库连接
func SetDB(database *gorm.DB) {
    lock.Lock()
    defer lock.Unlock()
    db = database
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
    lock.RLock()
    defer lock.RUnlock()
    return db
}