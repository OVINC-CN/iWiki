package permissionSvc

import (
	"context"
	"errors"
	"net/http"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// List 只返回当前账号仍在有效期内的授权。
func List(ctx context.Context) ([]permissionModels.Permission, error) {
	permissions := make([]permissionModels.Permission, 0)
	err := db.DB().WithContext(ctx).
		Where("user_id = ?", userUtils.Current(ctx).User.Username).
		Where("expired_at IS NULL OR expired_at > ?", time.Now().UTC()).
		Order("authed_at DESC").Find(&permissions).Error
	return permissions, err
}

// Require 在事务内锁定并校验授权。
func Require(ctx context.Context, tx *gorm.DB, item string) error {
	var permission permissionModels.Permission
	err := tx.Clauses(clause.Locking{Strength: "SHARE"}).
		Where("user_id = ? AND permission_item = ?", userUtils.Current(ctx).User.Username, item).
		Where("expired_at IS NULL OR expired_at > ?", time.Now().UTC()).Take(&permission).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return response.Error(http.StatusForbidden, "没有执行此操作的权限")
	}
	return err
}
