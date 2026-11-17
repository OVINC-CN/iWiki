package userSvc

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/oidc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

const userColumns = "username, nick_name, user_type, last_login, is_deleted, is_staff, is_superuser"

// Authenticate 校验会话并加载账号资料。
func Authenticate(ctx context.Context, raw string) (userUtils.Identity, error) {
	if len(raw) != 43 {
		return userUtils.Identity{}, response.Error(http.StatusUnauthorized, "请先登录")
	}
	digest := secure.Digest(raw)
	value, err := db.RDB().Get(ctx, sessionKey(digest)).Result()
	if errors.Is(err, redis.Nil) {
		return userUtils.Identity{}, response.Error(http.StatusUnauthorized, "登录已失效，请重新登录")
	}
	if err != nil {
		return userUtils.Identity{}, err
	}
	var session userModels.Session
	if json.Unmarshal([]byte(value), &session) != nil ||
		session.Issuer != config.Config.OIDC.Issuer || !session.ExpiresAt.After(time.Now()) {
		return userUtils.Identity{}, response.Error(http.StatusUnauthorized, "登录已失效，请重新登录")
	}
	var user userModels.User
	err = db.DB().WithContext(ctx).Select(userColumns).
		Where("username = ? AND is_deleted = ?", session.Username, false).Take(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) || (err == nil && user.Username != session.Username) {
		return userUtils.Identity{}, response.Error(http.StatusUnauthorized, "登录已失效，请重新登录")
	}
	if err != nil {
		return userUtils.Identity{}, err
	}
	if !allowed(user.Username) {
		return userUtils.Identity{}, response.Error(http.StatusForbidden, "当前账号不允许访问")
	}
	return userUtils.Identity{User: user, SessionDigest: digest}, nil
}

// SignIn 根据 sub 加载或创建账号并签发会话。
func SignIn(ctx context.Context, profile oidc.Profile) (string, error) {
	if !validSubject(profile.Subject) {
		return "", response.Error(http.StatusUnauthorized, "身份标识不符合用户名要求")
	}
	if !allowed(profile.Subject) {
		return "", response.Error(http.StatusForbidden, "当前账号不允许访问")
	}
	created := false
	err := db.Transaction(ctx, func(tx *gorm.DB) error {
		// 加载账号并更新昵称和登录时间。
		now := time.Now().UTC()
		candidate := userModels.User{
			Username:   profile.Subject,
			UserType:   "personal",
			Password:   "!",
			DateJoined: now,
		}
		result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&candidate)
		if result.Error != nil {
			return result.Error
		}
		created = result.RowsAffected > 0
		var user userModels.User
		if err := tx.Select(userColumns).Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("username = ?", profile.Subject).Take(&user).Error; err != nil {
			return err
		}
		if user.IsDeleted || user.Username != profile.Subject {
			return response.Error(http.StatusUnauthorized, "当前账号不可用")
		}
		updates := map[string]any{"last_login": now}
		if profile.Nickname != "" {
			name := []rune(profile.Nickname)
			updates["nick_name"] = string(name[:min(len(name), 32)])
		}
		return tx.Model(&user).Updates(updates).Error
	})
	if err != nil {
		return "", err
	}
	if created {
		logger.Logger.WithContext(ctx).Infof("OIDC account created; username: %q", profile.Subject)
	} else {
		logger.Logger.WithContext(ctx).
			Infof("Account login profile updated; username: %q", profile.Subject)
	}

	// 生成会话凭据及其摘要。
	raw, err := secure.Random(32)
	if err != nil {
		return "", err
	}
	session := userModels.Session{
		Username:  profile.Subject,
		Issuer:    config.Config.OIDC.Issuer,
		ExpiresAt: time.Now().UTC().Add(config.Config.Session.TTL),
	}
	data, err := json.Marshal(session)
	if err != nil {
		return "", err
	}
	if err := db.RDB().Set(ctx, sessionKey(secure.Digest(raw)), data, config.Config.Session.TTL).
		Err(); err != nil {
		return "", err
	}
	return raw, nil
}

// Logout 撤销当前会话。
func Logout(ctx context.Context) error {
	identity := userUtils.Current(ctx)
	if err := db.RDB().Del(ctx, sessionKey(identity.SessionDigest)).Err(); err != nil {
		return err
	}
	logger.Logger.WithContext(ctx).Infof("Session logged out; username: %q", identity.User.Username)
	return nil
}

func allowed(username string) bool {
	whitelist := config.Config.Session.UserWhitelist
	if len(whitelist) == 0 {
		return true
	}
	for _, entry := range whitelist {
		if entry == username {
			return true
		}
	}
	return false
}

func validSubject(value string) bool {
	return value != "" && utf8.ValidString(value) && utf8.RuneCountInString(value) <= 32 &&
		strings.TrimSpace(value) == value && strings.IndexFunc(value, unicode.IsControl) < 0
}

func sessionKey(digest string) string { return config.Config.Redis.Prefix + "session:" + digest }
