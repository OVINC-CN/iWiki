package cosModels

import (
	"time"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// Log 保存上传凭据的申请记录。
type Log struct {
	ID         string    `gorm:"column:id;primaryKey"`
	Filename   string    `gorm:"column:filename"`
	Key        string    `gorm:"column:key"`
	Resp       string    `gorm:"column:resp;type:json"`
	OwnerID    string    `gorm:"column:owner_id"`
	UploadedAt time.Time `gorm:"column:uploaded_at;autoCreateTime:false"`
}

func (Log) TableName() string { return "cos_coslog" }

type Request struct {
	Filename string `json:"filename" example:"示例图片.png"` // 文件名，不含路径。
}

// Credential 返回 COS 上传所需参数。
type Credential struct {
	COSURL       string `json:"cos_url"`        // COS 或 CDN 资源地址。
	COSBucket    string `json:"cos_bucket"`     // 存储桶名称。
	COSRegion    string `json:"cos_region"`     // 存储地域。
	Key          string `json:"key"`            // 上传对象路径。
	SecretID     string `json:"secret_id"`      // 临时访问密钥编号。
	SecretKey    string `json:"secret_key"`     // 临时访问密钥。
	Token        string `json:"token"`          // 临时安全令牌。
	StartTime    int64  `json:"start_time"`     // 临时凭据开始时间，Unix 秒。
	ExpiredTime  int64  `json:"expired_time"`   // 临时凭据失效时间，Unix 秒。
	CDNSign      string `json:"cdn_sign"`       // CDN 短时签名，可空。
	CDNSignParam string `json:"cdn_sign_param"` // CDN 签名参数名称。
	MaxFileBytes int64  `json:"max_file_bytes"` // 文件大小上限，单位为字节。
}

type CredentialEnvelope struct{ response.Envelope[Credential] }
