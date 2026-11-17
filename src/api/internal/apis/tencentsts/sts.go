package tencentsts

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common"
	"github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/common/profile"
	sts "github.com/tencentcloud/tencentcloud-sdk-go/tencentcloud/sts/v20180813"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/logger"
	"github.com/OVINC-CN/iWiki/src/api/internal/tracing"
)

var client *sts.Client
var transport *http.Transport

// Credential 保存 STS 临时访问凭据。
type Credential struct {
	SecretID   string
	SecretKey  string
	Token      string
	StartTime  int64
	ExpireTime int64
	RequestID  string
}

func init() {
	cfg := config.Config.COS
	if !cfg.Enabled {
		return
	}
	settings := profile.NewClientProfile()
	settings.HttpProfile.Endpoint = cfg.STSEndpoint
	settings.HttpProfile.Scheme = "HTTPS"
	settings.HttpProfile.ReqTimeout = max(1, int(cfg.RequestTimeout.Seconds()))
	settings.Debug = false
	settings.DisableRegionBreaker = true
	settings.NetworkFailureMaxRetries = 0
	settings.RateLimitExceededMaxRetries = 0
	var err error
	client, err = sts.NewClient(
		common.NewCredential(cfg.SecretID, cfg.SecretKey),
		cfg.Region,
		settings,
	)
	if err != nil {
		logger.Logger.Fatal("Upload credential client initialization failed")
	}
	transport = http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = nil
	client.WithHttpTransport(otelhttp.NewTransport(
		transport, otelhttp.WithTracerProvider(tracing.Provider),
	))
}

// Issue 申请指定对象的上传凭据。
func Issue(ctx context.Context, object string) (Credential, error) {
	if client == nil {
		return Credential{}, errors.New("upload service unavailable")
	}
	cfg := config.Config.COS
	appid := cfg.Bucket[strings.LastIndex(cfg.Bucket, "-")+1:]
	policy := map[string]any{
		"version": "2.0",
		"statement": []any{map[string]any{
			"effect": "allow",
			"action": []string{"name/cos:PutObject"},
			"resource": []string{
				fmt.Sprintf("qcs::cos:%s:uid/%s:%s/%s", cfg.Region, appid, cfg.Bucket, object),
			},
			"condition": map[string]any{
				"numeric_less_than_equal": map[string]int64{"cos:content-length": cfg.MaxFileBytes},
			},
		}},
	}
	encoded, err := json.Marshal(policy)
	if err != nil {
		return Credential{}, err
	}
	request := sts.NewGetFederationTokenRequest()
	request.Name = common.StringPtr("iwiki")
	request.Policy = common.StringPtr(url.QueryEscape(string(encoded)))
	request.DurationSeconds = common.Uint64Ptr(uint64(cfg.CredentialTTL.Seconds()))
	ctx, cancel := context.WithTimeout(ctx, cfg.RequestTimeout)
	defer cancel()
	start := time.Now().Unix()
	result, err := client.GetFederationTokenWithContext(ctx, request)
	if err != nil || result == nil || result.Response == nil ||
		result.Response.Credentials == nil || result.Response.ExpiredTime == nil {
		return Credential{}, errors.New("upload credential issuance failed")
	}
	value := result.Response.Credentials
	expiry, parseErr := strconv.ParseInt(
		strconv.FormatUint(*result.Response.ExpiredTime, 10),
		10,
		64,
	)
	if parseErr != nil || expiry <= start || value.TmpSecretId == nil ||
		value.TmpSecretKey == nil ||
		value.Token == nil ||
		*value.TmpSecretId == "" ||
		*value.TmpSecretKey == "" ||
		*value.Token == "" {
		return Credential{}, errors.New("invalid upload credentials")
	}
	requestID := ""
	if result.Response.RequestId != nil {
		requestID = *result.Response.RequestId
	}
	return Credential{
		SecretID:   *value.TmpSecretId,
		SecretKey:  *value.TmpSecretKey,
		Token:      *value.Token,
		StartTime:  start,
		ExpireTime: expiry,
		RequestID:  requestID,
	}, nil
}

// Close 在服务退出后关闭空闲连接。
func Close() {
	if transport != nil {
		transport.CloseIdleConnections()
	}
}
