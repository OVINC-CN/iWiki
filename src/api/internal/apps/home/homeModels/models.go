package homeModels

import (
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

type Home struct {
	Resp string          `json:"resp" example:"连接成功"` // 首页连接状态。
	User userModels.Info `json:"user"`                // 当前用户。
}

type Features struct {
	DocFuzzySearch bool `json:"doc_fuzzy_search"` // 是否允许关键词搜索。
}

type HomeEnvelope struct{ response.Envelope[Home] }
type FeaturesEnvelope struct{ response.Envelope[Features] }
