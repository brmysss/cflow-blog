package pkg

import (
	"github.com/gomarkdown/markdown"
	"github.com/gomarkdown/markdown/html"
	"github.com/gomarkdown/markdown/parser"
)

// 渲染 Markdown 为 HTML
func MdToHTML(md []byte) []byte {
	// 创建 Markdown 解析器
	extensions := parser.CommonExtensions | parser.AutoHeadingIDs | parser.NoEmptyLineBeforeBlock | parser.Tables | parser.MathJax | parser.Strikethrough
	p := parser.NewWithExtensions(extensions)
	doc := p.Parse(md)

	// 创建 HTML 渲染器
	htmlFlags := html.CommonFlags | html.HrefTargetBlank
	opts := html.RendererOptions{Flags: htmlFlags}
	renderer := html.NewRenderer(opts)

	// 渲染并返回 HTML
	return markdown.Render(doc, renderer)
}
