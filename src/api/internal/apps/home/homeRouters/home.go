package homeRouters

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/home/homeModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/db"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// Home 返回当前用户的首页信息。
// @Summary 查询首页信息
// @Tags 首页
// @Success 200 {object} homeModels.HomeEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/home [get]
func Home(c echo.Context) error {
	return response.Success(c, homeModels.Home{
		Resp: "连接成功", User: userUtils.Info(c.Request().Context()),
	})
}

// Features 返回配置控制的功能开关。
// @Summary 查询功能开关
// @Tags 首页
// @Success 200 {object} homeModels.FeaturesEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/features [get]
func Features(c echo.Context) error {
	return response.Success(c, homeModels.Features{
		DocFuzzySearch: config.Config.Document.SearchType != "",
	})
}

// Health 检查进程存活。
// @Summary 检查进程存活
// @Tags 探针
// @Success 200 {object} response.EmptyEnvelope
// @Router /health [get]
func Health(c echo.Context) error { return response.Success[any](c, nil) }

// Ready 检查服务就绪状态。
// @Summary 检查服务就绪
// @Tags 探针
// @Success 200 {object} response.EmptyEnvelope
// @Failure 503 {object} response.EmptyEnvelope
// @Router /ready [get]
func Ready(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), config.Config.HTTP.HealthCheckTimeout)
	defer cancel()
	err := db.Ping(ctx)
	if err != nil || db.DB() == nil || db.RDB() == nil {
		return response.Failure(c, http.StatusServiceUnavailable, "服务暂不可用")
	}
	return response.Success[any](c, nil)
}
