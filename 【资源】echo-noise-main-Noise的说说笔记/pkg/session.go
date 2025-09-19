package pkg

import (
	"net/http"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/lin-snow/ech0/internal/models"
)

const (
	UserKey = "user"
)

// 初始化 Session
func InitSession(r *gin.Engine) {
    store := cookie.NewStore([]byte("secret_key"))
    // 添加 cookie 配置
    store.Options(sessions.Options{
        Path:     "/",           // cookie 路径
        MaxAge:   86400,        // 过期时间：24小时
        HttpOnly: true,         // 防止 XSS 攻击
        Secure:   false,        // 开发环境设置 false，生产环境建议 true
        SameSite: http.SameSiteStrictMode,  // CSRF 保护
    })
    r.Use(sessions.Sessions("ech0_session", store))
}

// 保存用户会话
func SaveUserSession(c *gin.Context, user models.User) error {
    session := sessions.Default(c)
    session.Clear() // 清除旧数据
    
    // 存储用户信息
    session.Set(UserKey, map[string]interface{}{
        "id":       float64(user.ID),
        "username": user.Username,
        "is_admin": user.IsAdmin,
    })
    
    return session.Save()
}

// 获取用户会话
func GetUserSession(c *gin.Context) (models.User, bool) {
    session := sessions.Default(c)
    val := session.Get(UserKey)
    if val == nil {
        return models.User{}, false
    }
    
    // 类型断言和转换
    userMap, ok := val.(map[string]interface{})
    if !ok {
        return models.User{}, false
    }

    // 安全地获取和转换值
    id, ok := userMap["id"].(float64)
    if !ok {
        return models.User{}, false
    }

    username, ok := userMap["username"].(string)
    if !ok {
        return models.User{}, false
    }

    isAdmin, ok := userMap["is_admin"].(bool)
    if !ok {
        return models.User{}, false
    }

    user := models.User{
        ID:       uint(id),
        Username: username,
        IsAdmin:  isAdmin,
    }
    return user, true
}

// 清除用户会话
func ClearUserSession(c *gin.Context) error {
	session := sessions.Default(c)
	session.Clear()
	return session.Save()
}