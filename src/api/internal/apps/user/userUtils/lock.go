package userUtils

import (
	"context"
	"errors"
	"net/http"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// LockAccount 锁定账号并检查状态。
func LockAccount(ctx context.Context, tx *gorm.DB) error {
	username := Current(ctx).User.Username
	if username == "" {
		return response.Error(http.StatusUnauthorized, "请先登录")
	}
	var account userModels.User
	err := tx.Select("username, is_deleted").Clauses(clause.Locking{Strength: "SHARE"}).
		Where("username = ?", username).Take(&account).Error
	if errors.Is(err, gorm.ErrRecordNotFound) ||
		(err == nil && (account.IsDeleted || account.Username != username)) {
		return response.Error(http.StatusUnauthorized, "当前账号不可用")
	}
	return err
}
