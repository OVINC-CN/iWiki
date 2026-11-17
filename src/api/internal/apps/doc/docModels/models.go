package docModels

import (
	"time"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// Doc 保存文档内容、作者和可见性。
type Doc struct {
	ID        string    `gorm:"column:id;primaryKey"`
	Title     string    `gorm:"column:title"`
	Content   string    `gorm:"column:content"`
	HeaderImg *string   `gorm:"column:header_img"`
	IsPublic  bool      `gorm:"column:is_public"`
	PV        int64     `gorm:"column:pv"`
	OwnerID   string    `gorm:"column:owner_id"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime:false"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime:false"`
}

func (Doc) TableName() string { return "doc_doc" }

// DocBin 保存文档删除时的快照。
type DocBin struct {
	Doc
	DeletedAt time.Time `gorm:"column:deleted_at"`
}

func (DocBin) TableName() string { return "doc_docbin" }

type Tag struct {
	ID        string    `gorm:"column:id;primaryKey"                   json:"id"   example:"0123456789abcdef0123456789abcdef"` // 编号。
	Name      string    `gorm:"column:name"                            json:"name" example:"技术"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime:false" json:"-"`
}

func (Tag) TableName() string { return "doc_tag" }

type DocTag struct {
	ID        string    `gorm:"column:id;primaryKey"`
	DocID     string    `gorm:"column:doc_id"`
	TagID     string    `gorm:"column:tag_id"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime:false"`
}

func (DocTag) TableName() string { return "doc_doctag" }

type Comment struct {
	ID        string    `gorm:"column:id;primaryKey"`
	DocID     string    `gorm:"column:doc_id"`
	OwnerID   string    `gorm:"column:owner_id"`
	Content   string    `gorm:"column:content"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime:false"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime:false"`
}

func (Comment) TableName() string { return "doc_comment" }

type CommentBin struct {
	Comment
	DeletedAt time.Time `gorm:"column:deleted_at"`
}

func (CommentBin) TableName() string { return "doc_commentbin" }

// EditRequest 保存文档的完整编辑内容。
type EditRequest struct {
	Title     string     `json:"title"      example:"Go 学习笔记"` // 标题，最多 32 字符。
	Content   string     `json:"content"    example:"# 学习笔记"`  // Markdown 正文。
	HeaderImg *string    `json:"header_img" example:""`        // 封面，可空。
	IsPublic  *bool      `json:"is_public"  example:"true"`    // 是否向其他登录用户公开。
	Tags      *[]string  `json:"tags"       example:"技术,笔记"`   // 完整标签集合，空数组清空。
	CreatedAt *time.Time `json:"created_at"`                   // 创建时间，可选。
}

type Search struct {
	Page     int
	Size     int
	Tags     []string
	Keywords []string
}

// ListItem 是列表和详情共享的固定字段。
type ListItem struct {
	ID            string    `json:"id"`                                 // 编号。
	Owner         string    `json:"owner"           example:"zhangsan"` // 作者用户名。
	OwnerNickName string    `json:"owner_nick_name" example:"张三"`       // 作者昵称。
	Title         string    `json:"title"           example:"Go 学习笔记"`  // 文档标题，最多 32 个字符。
	HeaderImg     *string   `json:"header_img"`                         // 封面地址，可空。
	IsPublic      bool      `json:"is_public"`                          // 是否允许其他已登录用户读取。
	PV            int64     `json:"pv"`                                 // 阅读量。
	Comments      int64     `json:"comments"`                           // 评论数量。
	Tags          []string  `json:"tags"`                               // 标签名称集合。
	UpdatedAt     time.Time `json:"updated_at"`                         // 更新时间，UTC。
	CreatedAt     time.Time `json:"created_at"`                         // 创建时间，UTC。
}

type Detail struct {
	ListItem
	Content string `json:"content"` // Markdown 正文。
}

type Page struct {
	Total   int64      `json:"total"`   // 全部匹配记录数。
	Current int        `json:"current"` // 当前页码。
	Results []ListItem `json:"results"` // 当前页结果。
}

type IDResult struct {
	ID string `json:"id" example:"0123456789abcdef0123456789abcdef"` // 编号。
}

type PageEnvelope struct{ response.Envelope[Page] }
type DetailEnvelope struct{ response.Envelope[Detail] }
type IDEnvelope struct{ response.Envelope[IDResult] }
type TagsEnvelope struct{ response.Envelope[[]Tag] }
