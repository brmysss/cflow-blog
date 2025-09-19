package utils

import (
    "crypto/rand"
    "encoding/hex"
)

func GenerateToken(length int) (string, error) {
    b := make([]byte, length/2)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return hex.EncodeToString(b), nil
}