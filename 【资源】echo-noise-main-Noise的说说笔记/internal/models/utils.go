package models

import "golang.org/x/crypto/bcrypt"

// HashPassword 密码加密
func HashPassword(password string) string {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return ""
    }
    return string(bytes)
}