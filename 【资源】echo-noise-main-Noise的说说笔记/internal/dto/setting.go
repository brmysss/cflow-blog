// setting.go
package dto

type SettingDto struct {
    AllowRegistration bool     `json:"allowRegistration"`
    FrontendSettings  struct {
        SiteTitle          string   `json:"siteTitle"`
        SubtitleText       string   `json:"subtitleText"`
        AvatarURL          string   `json:"avatarURL"`
        Username           string   `json:"username"`
        Description        string   `json:"description"`
        Backgrounds        []string `json:"backgrounds"`
        CardFooterTitle    string   `json:"cardFooterTitle"`
        CardFooterLink     string   `json:"cardFooterLink"` 
        PageFooterHTML     string   `json:"pageFooterHTML"`
        RSSTitle          string   `json:"rssTitle"`
        RSSDescription    string   `json:"rssDescription"`
        RSSAuthorName     string   `json:"rssAuthorName"`
        RSSFaviconURL     string   `json:"rssFaviconURL"`
        WalineServerURL   string   `json:"walineServerURL"`
    } `json:"frontendSettings"`
}
