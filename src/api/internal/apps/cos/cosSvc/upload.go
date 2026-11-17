package cosSvc

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"gorm.io/gorm"

	"github.com/OVINC-CN/iWiki/src/api/internal/apis/tencentcdn"
	"github.com/OVINC-CN/iWiki/src/api/internal/apis/tencentsts"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/cos/cosModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionConstants"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
	"github.com/OVINC-CN/iWiki/src/api/internal/secure"
)

// Issue 同步申请上传凭据，外部调用不占用数据库事务锁。
func Issue(ctx context.Context, filename string) (cosModels.Credential, error) {
	var output cosModels.Credential
	if !validFilename(filename) {
		return output, response.Error(http.StatusBadRequest, "文件名无效")
	}
	cfg := config.Config.COS
	if !cfg.Enabled {
		return output, response.Error(http.StatusServiceUnavailable, "上传暂不可用")
	}
	object, err := objectKey(filename)
	if err != nil {
		return output, err
	}
	if utf8.RuneCountInString(object) > 255 {
		return output, response.Error(http.StatusBadRequest, "文件扩展名过长")
	}
	id, err := secure.ID()
	if err != nil {
		return output, err
	}
	entry := cosModels.Log{
		ID: id, Filename: filename, Key: object, Resp: `{"status":"pending"}`,
		OwnerID: userUtils.Current(ctx).User.Username, UploadedAt: time.Now().UTC(),
	}
	if err := db.Transaction(ctx, func(tx *gorm.DB) error {
		if err := authorize(ctx, tx); err != nil {
			return err
		}
		return tx.Create(&entry).Error
	}); err != nil {
		return output, err
	}
	logger.Logger.WithContext(ctx).Infof("Upload request created; record: %q", id)

	// 记录签发结果并复核上传权限。
	credential, issueErr := tencentsts.Issue(ctx, object)
	status := map[string]any{"status": "failed"}
	if issueErr == nil {
		status = map[string]any{
			"status": "issued", "request_id": credential.RequestID,
			"expired_time": credential.ExpireTime,
		}
	}
	encoded, err := json.Marshal(status)
	if err != nil {
		return output, err
	}
	err = db.Transaction(ctx, func(tx *gorm.DB) error {
		if issueErr == nil {
			if err := authorize(ctx, tx); err != nil {
				return err
			}
		}
		return tx.Model(&cosModels.Log{}).Where("id = ? AND owner_id = ?", id, entry.OwnerID).
			Update("resp", string(encoded)).Error
	})
	if err != nil {
		return output, err
	}
	if issueErr != nil {
		logger.Logger.WithContext(ctx).Errorf("Upload credential issuance failed; record: %q", id)
		return output, response.Error(http.StatusBadGateway, "上传凭据获取失败，请稍后重试")
	}
	logger.Logger.WithContext(ctx).Infof("Upload credentials issued; record: %q", id)
	base, _ := url.Parse(cfg.URL)
	path := (&url.URL{Path: strings.TrimRight(base.Path, "/") + "/" + object}).EscapedPath()
	signature, err := tencentcdn.SignPath(ctx, path)
	if err != nil {
		return output, err
	}
	return cosModels.Credential{
		COSURL: cfg.URL, COSBucket: cfg.Bucket, COSRegion: cfg.Region, Key: object,
		SecretID: credential.SecretID, SecretKey: credential.SecretKey, Token: credential.Token,
		StartTime: credential.StartTime, ExpiredTime: credential.ExpireTime,
		CDNSign: signature, CDNSignParam: cfg.CDNParameter,
		MaxFileBytes: cfg.MaxFileBytes,
	}, nil
}

func authorize(ctx context.Context, tx *gorm.DB) error {
	if err := userUtils.LockAccount(ctx, tx); err != nil {
		return err
	}
	return permissionSvc.Require(ctx, tx, permissionConstants.UploadFile)
}

func validFilename(value string) bool {
	return value != "" && value != "." && value != ".." &&
		strings.TrimSpace(value) != "" && utf8.ValidString(value) &&
		utf8.RuneCountInString(value) <= 255 && !strings.ContainsAny(value, "/\\") &&
		strings.IndexFunc(value, unicode.IsControl) < 0
}

func objectKey(filename string) (string, error) {
	name, err := secure.ID()
	if err != nil {
		return "", err
	}
	directory, err := secure.ID()
	if err != nil {
		return "", err
	}
	if index := strings.LastIndex(filename, "."); index >= 0 && index < len(filename)-1 {
		name += filename[index:]
	}
	location, _ := time.LoadLocation(config.Config.App.Timezone)
	return "upload/" + time.Now().In(location).Format("200601/02") + "/" +
		strings.ToUpper(directory[:10]) + "/" + name, nil
}
