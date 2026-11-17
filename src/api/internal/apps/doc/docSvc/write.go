package docSvc

import (
	"context"
	"net/http"
	"time"

	"gorm.io/gorm"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionConstants"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

// Save 校验权限后保存文档和标签。
func Save(ctx context.Context, id string, input docModels.EditRequest) (docModels.IDResult, error) {
	if err := validateEdit(ctx, &input); err != nil {
		return docModels.IDResult{}, err
	}
	creating := id == ""
	if creating {
		value, err := secure.ID()
		if err != nil {
			return docModels.IDResult{}, err
		}
		id = value
	}
	var removedTags int64
	err := db.Transaction(ctx, func(tx *gorm.DB) error {
		if err := userUtils.LockAccount(ctx, tx); err != nil {
			return err
		}
		now := time.Now().UTC()
		if creating {
			if err := permissionSvc.Require(ctx, tx, permissionConstants.CreateDoc); err != nil {
				return err
			}
			createdAt := now
			if input.CreatedAt != nil {
				createdAt = input.CreatedAt.UTC()
			}
			doc := docModels.Doc{
				ID: id, Title: input.Title, Content: input.Content, HeaderImg: input.HeaderImg,
				IsPublic: *input.IsPublic, OwnerID: userUtils.Current(ctx).User.Username,
				CreatedAt: createdAt, UpdatedAt: now,
			}
			if err := tx.Create(&doc).Error; err != nil {
				return err
			}
		} else {
			var doc docModels.Doc
			if err := loadDoc(tx, id, &doc); err != nil {
				return err
			}
			if doc.OwnerID != userUtils.Current(ctx).User.Username {
				return response.Error(http.StatusForbidden, "只能修改自己的文档")
			}
			updates := map[string]any{
				"title": input.Title, "content": input.Content, "header_img": input.HeaderImg,
				"is_public": *input.IsPublic, "updated_at": now,
			}
			if input.CreatedAt != nil {
				updates["created_at"] = input.CreatedAt.UTC()
			}
			if err := tx.Model(&doc).Updates(updates).Error; err != nil {
				return err
			}
		}
		count, bindErr := bindTags(tx, id, *input.Tags)
		removedTags = count
		return bindErr
	})
	if err != nil {
		logger.Logger.WithContext(ctx).Errorf("Document save failed; document: %q", id)
	} else {
		logger.Logger.WithContext(ctx).
			Infof("Document saved; document: %q; removed tags: %d", id, removedTags)
	}
	return docModels.IDResult{ID: id}, err
}

// Delete 保存文档快照并删除关联记录。
func Delete(ctx context.Context, id string) error {
	var removedTags int64
	err := db.Transaction(ctx, func(tx *gorm.DB) error {
		if err := userUtils.LockAccount(ctx, tx); err != nil {
			return err
		}
		var doc docModels.Doc
		if err := loadDoc(tx, id, &doc); err != nil {
			return err
		}
		if doc.OwnerID != userUtils.Current(ctx).User.Username {
			return response.Error(http.StatusForbidden, "只能删除自己的文档")
		}
		var tagIDs []string
		if err := tx.Model(&docModels.DocTag{}).Where("doc_id = ?", id).
			Pluck("tag_id", &tagIDs).Error; err != nil {
			return err
		}
		if err := lockTags(tx, tagIDs); err != nil {
			return err
		}
		if err := tx.Create(
			&docModels.DocBin{Doc: doc, DeletedAt: time.Now().UTC()},
		).Error; err != nil {
			return err
		}
		for _, model := range []any{
			&docModels.CommentBin{}, &docModels.Comment{}, &docModels.DocTag{},
		} {
			if err := tx.Where("doc_id = ?", id).Delete(model).Error; err != nil {
				return err
			}
		}
		if err := tx.Delete(&doc).Error; err != nil {
			return err
		}
		count, cleanupErr := cleanupTags(tx, tagIDs)
		removedTags = count
		return cleanupErr
	})
	if err != nil {
		logger.Logger.WithContext(ctx).Errorf("Document deletion failed; document: %q", id)
	} else {
		logger.Logger.WithContext(ctx).
			Infof("Document deleted; document: %q; removed tags: %d", id, removedTags)
	}
	return err
}
