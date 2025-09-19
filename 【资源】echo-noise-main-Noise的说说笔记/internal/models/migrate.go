package models

import (
    "gorm.io/gorm"
    "fmt"
)

func MigrateDB(db *gorm.DB) error {
    dbType := db.Dialector.Name()
    var err error
    switch dbType {
    case "postgres":
        err = db.Set("gorm:table_options", "").
            Set("gorm:varchar_size", 255).
            AutoMigrate(&User{}, &Message{}, &Setting{}, &SiteConfig{}, &NotifyConfig{})
    case "mysql":
        err = db.Set("gorm:table_options", "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci").
            Set("gorm:varchar_size", 191).
            AutoMigrate(&User{}, &Message{}, &Setting{}, &SiteConfig{}, &NotifyConfig{})
    default: // sqlite
        err = db.Set("gorm:varchar_size", 255).
            AutoMigrate(&User{}, &Message{}, &Setting{}, &SiteConfig{}, &NotifyConfig{})
    }
    
    if err != nil {
        return err
    }

    // 使用事务进行初始化操作
    return db.Transaction(func(tx *gorm.DB) error {
        // 为现有用户添加 Token 字段
        var users []User
        if err := tx.Find(&users).Error; err != nil {
            return err
        }
        for _, user := range users {
            if user.Token == "" {
                newToken := GenerateToken(32)
                if err := tx.Model(&User{}).Where("id = ?", user.ID).Update("token", newToken).Error; err != nil {
                    return err
                }
            }
        }

        // 初始化系统设置
        var setting Setting
        if err := tx.First(&setting).Error; err != nil {
            defaultSetting := Setting{
                AllowRegistration: true,
            }
            if err := tx.Create(&defaultSetting).Error; err != nil {
                return err
            }
        }

        // 检查是否存在任何用户
        var userCount int64
        if err := tx.Model(&User{}).Count(&userCount).Error; err != nil {
            return err
        }

        // 只有在没有任何用户时才初始化管理员账户
        if userCount == 0 {
            defaultAdmin := User{
                Username: "admin",
                Password: HashPassword("admin"),
                IsAdmin:  true,
                Token:    GenerateToken(32),
            }
            if err := tx.Create(&defaultAdmin).Error; err != nil {
                return err
            }
        }

        // 初始化前端配置
        var config SiteConfig
        defaultBg := `https://s2.loli.net/2025/03/27/KJ1trnU2ksbFEYM.jpg,
https://s2.loli.net/2025/03/27/MZqaLczCvwjSmW7.jpg,
https://s2.loli.net/2025/03/27/UMijKXwJ9yTqSeE.jpg,
https://s2.loli.net/2025/03/27/WJQIlkXvBg2afcR.jpg,
https://s2.loli.net/2025/03/27/oHNQtf4spkq2iln.jpg,
https://s2.loli.net/2025/03/27/PMRuX5loc6Uaimw.jpg,
https://s2.loli.net/2025/03/27/U2WIslbNyTLt4rD.jpg,
https://s2.loli.net/2025/03/27/xu1jZL5Og4pqT9d.jpg,
https://s2.loli.net/2025/03/27/OXqwzZ6v3PVIns9.jpg,
https://s2.loli.net/2025/03/27/HGuqlE6apgNywbh.jpg,
https://s2.loli.net/2025/03/26/d7iyuPYA8cRqD1K.jpg,
https://s2.loli.net/2025/03/27/7Zck3y6XTzhYPs5.jpg,
https://s2.loli.net/2025/03/27/y67m2k5xcSdTsHN.jpg`

        defaultConfig := SiteConfig{
            SiteTitle:        "Noise的说说笔记",
            SubtitleText:     "欢迎访问，点击头像可更换封面背景！",
            AvatarURL:        "https://s2.loli.net/2025/03/24/HnSXKvibAQlosIW.png",
            Username:         "Noise",
            Description:      "执迷不悟",
            Backgrounds:      defaultBg,
            CardFooterTitle:  "Noise·说说·笔记~",
            CardFooterLink:   "note.noisework.cn",
            PageFooterHTML:   `<div class="text-center text-xs text-gray-400 py-4">来自<a href="https://www.noisework.cn" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:text-orange-500">Noise</a> 使用<a href="https://github.com/rcy1314/echo-noise" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:text-orange-500">Ech0-Noise</a>发布</div>`,
            RSSTitle:         "Noise的说说笔记",
            RSSDescription:   "一个说说笔记~",
            RSSAuthorName:    "Noise",
            RSSFaviconURL:    "/favicon.ico",
            WalineServerURL:  "请前往waline官网https://waline.js.org查看部署配置",
        }

        // 检查是否存在配置
        if err := tx.First(&config).Error; err != nil {
            // 数据库中没有配置时，创建默认配置
            if err := tx.Create(&defaultConfig).Error; err != nil {
                return err
            }
        } else {
            // 数据库中已有配置时，只更新空值字段
            updates := make(map[string]interface{})
            
            if config.Backgrounds == "" {
                updates["backgrounds"] = defaultConfig.Backgrounds
            }
            if config.AvatarURL == "" {
                updates["avatar_url"] = defaultConfig.AvatarURL
            }
            if config.SiteTitle == "" {
                updates["site_title"] = defaultConfig.SiteTitle
            }
            if config.SubtitleText == "" {
                updates["subtitle_text"] = defaultConfig.SubtitleText
            }
            if config.Username == "" {
                updates["username"] = defaultConfig.Username
            }
            if config.Description == "" {
                updates["description"] = defaultConfig.Description
            }
            if config.CardFooterTitle == "" {
                updates["card_footer_title"] = defaultConfig.CardFooterTitle
            }
            if config.CardFooterLink == "" {
                updates["card_footer_link"] = defaultConfig.CardFooterLink
            }
            if config.PageFooterHTML == "" {
                updates["page_footer_html"] = defaultConfig.PageFooterHTML
            }
            if config.RSSTitle == "" {
                updates["rss_title"] = defaultConfig.RSSTitle
            }
            if config.RSSDescription == "" {
                updates["rss_description"] = defaultConfig.RSSDescription
            }
            if config.RSSAuthorName == "" {
                updates["rss_author_name"] = defaultConfig.RSSAuthorName
            }
            if config.RSSFaviconURL == "" {
                updates["rss_favicon_url"] = defaultConfig.RSSFaviconURL
            }
            if config.WalineServerURL == "" {
                updates["waline_server_url"] = defaultConfig.WalineServerURL
            }
            
            if len(updates) > 0 {
                if err := tx.Model(&config).Updates(updates).Error; err != nil {
                    return err
                }
            }
        }

        // 初始化推送配置
        var notifyConfig NotifyConfig
        if err := tx.First(&notifyConfig).Error; err != nil {
            defaultNotifyConfig := NotifyConfig{
                WebhookEnabled:   false,
                WebhookURL:      "WebhookURL",
                TelegramEnabled:  false,
                TelegramToken:   "bot_token",
                TelegramChatID:  "chat_id",
                WeworkEnabled:    false,
                WeworkKey:       "WebhookURL",
                FeishuEnabled:    false,
                FeishuWebhook:   "FeishuWebhook",
                FeishuSecret:    "secret",
                TwitterEnabled:         false,
                TwitterApiKey:          "twitter_api_key",
                TwitterApiSecret:       "twitter_api_secret",
                TwitterAccessToken:     "twitter_access_token",
                TwitterAccessTokenSecret: "twitter_access_token_secret",
                CustomHttpEnabled:      false,
                CustomHttpUrl:          "https://example.com/notify",
                CustomHttpMethod:       "POST",
                CustomHttpHeaders:      `{"Authorization":"Bearer token"}`,
                CustomHttpBody:         `{"content":"{{content}}"}`,
            }
            if err := tx.Create(&defaultNotifyConfig).Error; err != nil {
                return fmt.Errorf("初始化推送配置失败: %v", err)
            }
        }

        return nil
    })
}