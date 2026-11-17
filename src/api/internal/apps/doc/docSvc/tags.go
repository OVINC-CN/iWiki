package docSvc

import (
	"context"
	"slices"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

// Tags 查询全部标签或已绑定标签。
func Tags(ctx context.Context, bound bool) ([]docModels.Tag, error) {
	items := make([]docModels.Tag, 0)
	query := db.DB().WithContext(ctx).Model(&docModels.Tag{})
	if bound {
		query = query.Where("id IN (?)", db.DB().WithContext(ctx).
			Model(&docModels.DocTag{}).Select("tag_id"))
	}
	err := query.Order("name ASC").Find(&items).Error
	return items, err
}

func bindTags(tx *gorm.DB, docID string, names []string) (int64, error) {
	// 按名称排序后创建标签。
	names = slices.Clone(names)
	slices.Sort(names)
	names = slices.Compact(names)
	var oldIDs []string
	if err := tx.Model(&docModels.DocTag{}).Where("doc_id = ?", docID).
		Pluck("tag_id", &oldIDs).Error; err != nil {
		return 0, err
	}
	newIDs := make([]string, 0, len(names))
	for _, name := range names {
		id, err := secure.ID()
		if err != nil {
			return 0, err
		}
		tag := docModels.Tag{ID: id, Name: name, CreatedAt: time.Now().UTC()}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&tag).Error; err != nil {
			return 0, err
		}
		tag = docModels.Tag{}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("name = ?", name).Take(&tag).Error; err != nil {
			return 0, err
		}
		newIDs = append(newIDs, tag.ID)
	}
	allIDs := append(slices.Clone(oldIDs), newIDs...)
	if err := lockTags(tx, allIDs); err != nil {
		return 0, err
	}
	slices.Sort(newIDs)
	newIDs = slices.Compact(newIDs)
	for _, tagID := range newIDs {
		id, err := secure.ID()
		if err != nil {
			return 0, err
		}
		link := docModels.DocTag{
			ID: id, DocID: docID, TagID: tagID, CreatedAt: time.Now().UTC(),
		}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&link).Error; err != nil {
			return 0, err
		}
	}
	remove := tx.Where("doc_id = ?", docID)
	if len(newIDs) > 0 {
		remove = remove.Where("tag_id NOT IN ?", newIDs)
	}
	if err := remove.Delete(&docModels.DocTag{}).Error; err != nil {
		return 0, err
	}
	return cleanupTags(tx, oldIDs)
}

func lockTags(tx *gorm.DB, ids []string) error {
	// 按标签编号顺序加锁。
	ids = slices.Clone(ids)
	slices.Sort(ids)
	ids = slices.Compact(ids)
	for _, id := range ids {
		var tag docModels.Tag
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).Take(&tag).Error; err != nil {
			return err
		}
	}
	return nil
}

func cleanupTags(tx *gorm.DB, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	// 使用当前读确认标签已无引用。
	result := tx.Where("id IN ?", ids).
		Where("NOT EXISTS (SELECT 1 FROM doc_doctag WHERE doc_doctag.tag_id = doc_tag.id)").
		Delete(&docModels.Tag{})
	return result.RowsAffected, result.Error
}
