package docSvc

import (
	"context"
	"net/http"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/tencentcdn"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

func validateEdit(ctx context.Context, input *docModels.EditRequest) error {
	// 校验标题、正文和标签。
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" || utf8.RuneCountInString(input.Title) > 32 ||
		!utf8.ValidString(input.Title) || strings.TrimSpace(input.Content) == "" ||
		!utf8.ValidString(input.Content) {
		return response.Error(http.StatusBadRequest, "标题或正文无效，标题最多 32 个字符")
	}
	if len(input.Content) > config.Config.Document.MaxContentBytes {
		return response.Error(http.StatusRequestEntityTooLarge, "文档正文超过大小限制")
	}
	if input.IsPublic == nil || input.Tags == nil {
		return response.Error(http.StatusBadRequest, "必须提供可见性和完整标签集合")
	}
	if len(*input.Tags) > config.Config.Document.MaxTags {
		return response.Error(http.StatusBadRequest, "文档标签数量超过限制")
	}
	for index, name := range *input.Tags {
		name = strings.TrimSpace(name)
		if name == "" || !utf8.ValidString(name) || utf8.RuneCountInString(name) > 32 {
			return response.Error(http.StatusBadRequest, "标签不能为空且最多 32 个字符")
		}
		(*input.Tags)[index] = name
	}
	if input.CreatedAt != nil && (input.CreatedAt.Year() < 1000 || input.CreatedAt.Year() > 9999) {
		return response.Error(http.StatusBadRequest, "创建时间无效")
	}
	if input.HeaderImg != nil {
		value := strings.TrimSpace(*input.HeaderImg)
		if value == "" {
			input.HeaderImg = nil
		} else {
			parsed, err := url.Parse(value)
			if err != nil || parsed.Host == "" || parsed.User != nil ||
				(parsed.Scheme != "http" && parsed.Scheme != "https") {
				return response.Error(http.StatusBadRequest, "封面必须是有效的 HTTP(S) 地址")
			}
			value = tencentcdn.Normalize(value)
			input.HeaderImg = &value
		}
	}
	content, err := tencentcdn.Content(ctx, input.Content, false)
	input.Content = content
	return err
}

func validateSearch(input docModels.Search) error {
	if input.Page < 1 || input.Size < 1 || input.Size > config.Config.HTTP.MaxPageSize ||
		input.Page > int(^uint(0)>>1)/input.Size {
		return response.Error(http.StatusBadRequest, "分页参数无效")
	}
	if len(input.Tags) > config.Config.Document.MaxSearchValues ||
		len(input.Keywords) > config.Config.Document.MaxSearchValues {
		return response.Error(http.StatusBadRequest, "筛选条件数量超过限制")
	}
	for _, values := range [][]string{input.Tags, input.Keywords} {
		for _, value := range values {
			if !utf8.ValidString(value) || utf8.RuneCountInString(value) > 32 {
				return response.Error(http.StatusBadRequest, "筛选值最多 32 个字符")
			}
		}
	}
	if len(input.Keywords) > 0 && config.Config.Document.SearchType == "" {
		return response.Error(http.StatusBadRequest, "当前未开启关键词搜索")
	}
	return nil
}
