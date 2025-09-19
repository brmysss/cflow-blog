package pkg

import (
    "crypto/md5"
    "encoding/hex"
)

// MD5Encrypt 使用 MD5 算法加密字符串
func MD5Encrypt(str string) string {
    h := md5.New()
    h.Write([]byte(str))
    return hex.EncodeToString(h.Sum(nil))
}