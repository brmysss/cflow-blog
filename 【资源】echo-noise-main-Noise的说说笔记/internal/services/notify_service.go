package services

import (
    "fmt"
    "regexp"
    "strings"
    
    "github.com/gomarkdown/markdown"
    mdhtml "github.com/gomarkdown/markdown/html"
    "github.com/gomarkdown/markdown/parser"
)

// RenderMarkdownPreview 将 Markdown 内容转换为预览状态
func RenderMarkdownPreview(content string) string {
    // 使用 gomarkdown 库解析 Markdown
    extensions := parser.CommonExtensions | parser.AutoHeadingIDs
    p := parser.NewWithExtensions(extensions)
    
    // 解析 Markdown 内容
    doc := p.Parse([]byte(content))
    
    // 设置 HTML 渲染选项
    htmlFlags := mdhtml.CommonFlags | mdhtml.HrefTargetBlank
    opts := mdhtml.RendererOptions{Flags: htmlFlags}
    renderer := mdhtml.NewRenderer(opts)
    
    // 渲染为 HTML
    htmlContent := markdown.Render(doc, renderer)
    
    return string(htmlContent)
}

// ProcessMarkdownWithImages 处理 Markdown 内容并将图片链接转换为 HTML 图片标签
func ProcessMarkdownWithImages(content string, additionalImages []string) string {
    // 先将 Markdown 转换为 HTML
    htmlContent := RenderMarkdownPreview(content)
    
    // 如果有额外的图片，将它们添加到 HTML 内容的末尾
    if len(additionalImages) > 0 {
        var imgTags strings.Builder
        for _, imgURL := range additionalImages {
            imgTags.WriteString(fmt.Sprintf("<img src=\"%s\" alt=\"附加图片\" /><br/>", imgURL))
        }
        htmlContent = string(htmlContent) + imgTags.String()
    }
    
    return htmlContent
}

// FormatContentForTelegram 格式化内容以适应 Telegram
func FormatContentForTelegram(content string, images []string, format string) string {
    // 处理 Markdown 和图片
    htmlContent := ProcessMarkdownWithImages(content, images)
    
    if format == "html" {
        // Telegram 支持 HTML 格式，但需要确保所有标签都是有效的
        // 这里可以添加额外的处理逻辑
        return htmlContent
    } else {
        // 如果不是 HTML 格式，则需要将 HTML 转换为纯文本或 Markdown
        // 这里简单地移除 HTML 标签
        // 实际应用中可能需要更复杂的处理
        re := regexp.MustCompile("<[^>]*>")
        plainText := re.ReplaceAllString(htmlContent, "")
        
        // 转义 MarkdownV2 中的特殊字符
        specialChars := []string{"_", "*", "[", "]", "(", ")", "~", "`", ">", "#", "+", "-", "=", "|", "{", "}", ".", "!"}
        for _, char := range specialChars {
            plainText = strings.ReplaceAll(plainText, char, "\\"+char)
        }
        
        return plainText
    }
}

// FormatContentForWework 格式化内容以适应企业微信
func FormatContentForWework(content string, images []string) string {
    // 企业微信推荐 markdown 格式
    markdownContent := content
    if len(images) > 0 {
        for _, img := range images {
            markdownContent += fmt.Sprintf("\n![](%s)", img)
        }
    }
    return markdownContent
}

// FormatContentForFeishu 格式化内容以适应飞书
func FormatContentForFeishu(content string, images []string) string {
    // 飞书推荐 markdown 格式
    markdownContent := content
    if len(images) > 0 {
        for _, img := range images {
            markdownContent += fmt.Sprintf("\n![](%s)", img)
        }
    }
    return markdownContent
}

// FormatContentForWebhook 格式化内容以适应 Webhook
func FormatContentForWebhook(content string, images []string) string {
    // Webhook 可能需要特定格式
    htmlContent := ProcessMarkdownWithImages(content, images)
    
    // 这里可以添加 Webhook 特定的格式化逻辑
    
    return htmlContent
}

// FormatContentForTwitter 格式化内容以适应 Twitter
func FormatContentForTwitter(content string, images []string) string {
    // Twitter 仅支持纯文本，且有长度限制（280字符）
    // 合并文本和图片链接
    text := content
    if len(images) > 0 {
        for _, img := range images {
            text += " " + img
        }
    }
    // 截断到280字符
    if len([]rune(text)) > 280 {
        runes := []rune(text)
        text = string(runes[:280])
    }
    return text
}

// FormatContentForCustomHttp 格式化内容以适应自定义HTTP
func FormatContentForCustomHttp(content string, images []string) string {
    // 默认将内容和图片链接合并为一段文本
    text := content
    if len(images) > 0 {
        for _, img := range images {
            text += "\n" + img
        }
    }
    return text
}