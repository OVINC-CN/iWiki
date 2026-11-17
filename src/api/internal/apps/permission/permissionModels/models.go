package permissionModels

import (
	"time"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// Permission 保存用户授权及失效时间。
type Permission struct {
	ID             string     `gorm:"column:id;primaryKey"                  json:"-"`
	UserID         string     `gorm:"column:user_id"                        json:"-"`
	PermissionItem string     `gorm:"column:permission_item"                json:"permission_item" example:"create_doc"` // 授权项，仅支持 create_doc 或 upload_file。
	ExpiredAt      *time.Time `gorm:"column:expired_at"                     json:"expired_at"`                           // 失效时间，空值为长期有效。
	AuthedAt       time.Time  `gorm:"column:authed_at;autoCreateTime:false" json:"-"`
}

func (Permission) TableName() string { return "permission_userpermission" }

type ListEnvelope struct {
	response.Envelope[[]Permission]
}
