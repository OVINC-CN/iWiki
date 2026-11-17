package userModels

import (
	"time"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// User 保存账号资料。
type User struct {
	Username    string     `gorm:"column:username;primaryKey"              json:"username"`   // 用户名。
	NickName    *string    `gorm:"column:nick_name"                        json:"nick_name"`  // 昵称。
	UserType    string     `gorm:"column:user_type"                        json:"user_type"`  // 账号类型。
	LastLogin   *time.Time `gorm:"column:last_login"                       json:"last_login"` // 最近登录时间。
	DateJoined  time.Time  `gorm:"column:date_joined;autoCreateTime:false" json:"-"`
	Password    string     `gorm:"column:password"                         json:"-"`
	IsDeleted   bool       `gorm:"column:is_deleted"                       json:"-"`
	IsStaff     bool       `gorm:"column:is_staff"                         json:"-"`
	IsSuperuser bool       `gorm:"column:is_superuser"                     json:"-"`
}

func (User) TableName() string { return "account_user" }

// Info 返回账号基本资料。
type Info struct {
	Username  string     `json:"username"   example:"zhangsan"` // 当前账号用户名。
	NickName  *string    `json:"nick_name"  example:"张三"`       // 用户昵称。
	UserType  string     `json:"user_type"  example:"personal"` // 账号类型。
	LastLogin *time.Time `json:"last_login"`                    // 最近登录时间，UTC。
}

type InfoEnvelope struct{ response.Envelope[Info] }

// LoginURL 返回身份提供方的登录地址。
type LoginURL struct {
	AuthorizationURL string `json:"authorization_url"` // 登录地址。
}

type LoginURLEnvelope struct{ response.Envelope[LoginURL] }

// LoginResult 返回登录后的站内路径。
type LoginResult struct {
	ReturnTo string `json:"return_to" example:"/docs"` // 登录后的访问路径。
}

type LoginResultEnvelope struct{ response.Envelope[LoginResult] }

// Session 保存账号和会话有效期。
type Session struct {
	Username  string    `json:"username"`   // 当前账号用户名。
	Issuer    string    `json:"issuer"`     // 唯一可信身份提供方。
	ExpiresAt time.Time `json:"expires_at"` // 会话失效时间。
}

// LoginState 是一次性 OIDC 流程的短期服务端状态。
type LoginState struct {
	Nonce       string `json:"nonce"`        // 待验证的 OIDC 随机数。
	Verifier    string `json:"verifier"`     // PKCE 校验值。
	BrowserHash string `json:"browser_hash"` // 浏览器绑定凭据的摘要。
	ReturnTo    string `json:"return_to"`    // 登录后的站内路径。
}
