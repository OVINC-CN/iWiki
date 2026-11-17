package docSvc

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/tencentcdn"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

type docRow struct {
	docModels.Doc
	OwnerNickName *string `gorm:"column:owner_nick_name"`
}

const listColumns = "doc_doc.id, doc_doc.title, doc_doc.header_img, doc_doc.is_public, " +
	"doc_doc.pv, doc_doc.owner_id, doc_doc.updated_at, doc_doc.created_at, " +
	"account_user.nick_name AS owner_nick_name"

// List 的总数和当前页使用相同的可见范围及搜索条件。
func List(ctx context.Context, input docModels.Search) (docModels.Page, error) {
	page := docModels.Page{Current: input.Page, Results: make([]docModels.ListItem, 0)}
	if err := validateSearch(input); err != nil {
		return page, err
	}
	err := db.Transaction(ctx, func(tx *gorm.DB) error {
		if err := userUtils.LockAccount(ctx, tx); err != nil {
			return err
		}
		query := filtered(tx, ctx, input)
		if err := query.Count(&page.Total).Error; err != nil {
			return err
		}
		if input.Page > 1 && int64(input.Page-1)*int64(input.Size) >= page.Total {
			return response.Error(http.StatusNotFound, "页码超出范围")
		}
		var rows []docRow
		if err := query.Select(listColumns).
			Joins("LEFT JOIN account_user ON account_user.username = doc_doc.owner_id").
			Order("doc_doc.created_at DESC").Order("doc_doc.id DESC").
			Offset((input.Page - 1) * input.Size).Limit(input.Size).Scan(&rows).Error; err != nil {
			return err
		}
		items, err := enrich(tx, rows)
		page.Results = items
		return err
	})
	if err == nil {
		err = signItems(ctx, page.Results)
	}
	return page, err
}

func filtered(tx *gorm.DB, ctx context.Context, input docModels.Search) *gorm.DB {
	query := tx.Model(&docModels.Doc{}).
		Where("(doc_doc.owner_id = ? OR doc_doc.is_public = ?)", userUtils.Current(ctx).User.Username, true)
	if len(input.Tags) > 0 {
		tags := tx.Model(&docModels.Tag{}).Select("id").Where("name IN ?", input.Tags)
		links := tx.Model(&docModels.DocTag{}).Select("doc_id").Where("tag_id IN (?)", tags)
		query = query.Where("doc_doc.id IN (?)", links)
	}
	if len(input.Keywords) > 0 {
		fields := []string{config.Config.Document.SearchType}
		if config.Config.Document.SearchType == "all" {
			fields = []string{"title", "content"}
		}
		groups := make([]string, 0, len(fields))
		arguments := make([]any, 0, len(fields)*len(input.Keywords))
		for _, field := range fields {
			conditions := make([]string, 0, len(input.Keywords))
			for _, word := range input.Keywords {
				// 按字段匹配全部关键词，通配符按普通字符处理。
				conditions = append(conditions, "doc_doc."+field+" LIKE BINARY ? ESCAPE '!'")
				word = strings.NewReplacer("!", "!!", "%", "!%", "_", "!_").Replace(word)
				arguments = append(arguments, "%"+word+"%")
			}
			groups = append(groups, "("+strings.Join(conditions, " AND ")+")")
		}
		query = query.Where("("+strings.Join(groups, " OR ")+")", arguments...)
	}
	return query
}

// Detail 查询文档详情并更新阅读量。
func Detail(ctx context.Context, id string) (docModels.Detail, error) {
	var detail docModels.Detail
	err := db.Transaction(ctx, func(tx *gorm.DB) error {
		if err := userUtils.LockAccount(ctx, tx); err != nil {
			return err
		}
		var doc docModels.Doc
		if err := loadDoc(tx, id, &doc); err != nil {
			return err
		}
		if doc.OwnerID != userUtils.Current(ctx).User.Username && !doc.IsPublic {
			return response.Error(http.StatusForbidden, "没有查看此文档的权限")
		}
		if err := tx.Model(&doc).UpdateColumn("pv", gorm.Expr("pv + 1")).Error; err != nil {
			return err
		}
		var row docRow
		if err := tx.Model(&docModels.Doc{}).Select(listColumns).
			Joins("LEFT JOIN account_user ON account_user.username = doc_doc.owner_id").
			Where("doc_doc.id = ?", id).Scan(&row).Error; err != nil {
			return err
		}
		row.Doc = doc
		items, err := enrich(tx, []docRow{row})
		if err != nil {
			return err
		}
		detail.ListItem = items[0]
		detail.Content = doc.Content
		return nil
	})
	if err != nil {
		return detail, err
	}
	logger.Logger.WithContext(ctx).Infof("Document view count incremented; document: %q", id)
	items := []docModels.ListItem{detail.ListItem}
	if err := signItems(ctx, items); err != nil {
		return detail, err
	}
	detail.ListItem = items[0]
	detail.Content, err = tencentcdn.Content(ctx, detail.Content, true)
	return detail, err
}

func loadDoc(tx *gorm.DB, id string, doc *docModels.Doc) error {
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).Take(doc).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return response.Error(http.StatusNotFound, "文档不存在")
	}
	return err
}

func enrich(tx *gorm.DB, rows []docRow) ([]docModels.ListItem, error) {
	items := make([]docModels.ListItem, 0, len(rows))
	if len(rows) == 0 {
		return items, nil
	}
	ids := make([]string, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	var links []struct{ DocID, Name string }
	if err := tx.Table("doc_doctag").Select("doc_doctag.doc_id, doc_tag.name").
		Joins("JOIN doc_tag ON doc_tag.id = doc_doctag.tag_id").
		Where("doc_doctag.doc_id IN ?", ids).
		Order("doc_tag.name ASC").Scan(&links).Error; err != nil {
		return nil, err
	}
	var counts []struct {
		DocID string
		Total int64
	}
	if err := tx.Model(&docModels.Comment{}).Select("doc_id, COUNT(*) AS total").
		Where("doc_id IN ?", ids).Group("doc_id").Scan(&counts).Error; err != nil {
		return nil, err
	}
	tags := make(map[string][]string)
	comments := make(map[string]int64)
	for _, link := range links {
		tags[link.DocID] = append(tags[link.DocID], link.Name)
	}
	for _, count := range counts {
		comments[count.DocID] = count.Total
	}
	for _, row := range rows {
		item := docModels.ListItem{
			ID: row.ID, Owner: row.OwnerID, Title: row.Title, HeaderImg: row.HeaderImg,
			IsPublic: row.IsPublic, PV: row.PV, Comments: comments[row.ID], Tags: tags[row.ID],
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		}
		if item.Tags == nil {
			item.Tags = []string{}
		}
		slices.Sort(item.Tags)
		if row.OwnerNickName != nil {
			item.OwnerNickName = *row.OwnerNickName
		}
		items = append(items, item)
	}
	return items, nil
}

func signItems(ctx context.Context, items []docModels.ListItem) error {
	for index := range items {
		if items[index].HeaderImg != nil {
			signed, err := tencentcdn.Sign(ctx, tencentcdn.Normalize(*items[index].HeaderImg))
			if err != nil {
				return err
			}
			items[index].HeaderImg = &signed
		}
	}
	return nil
}
