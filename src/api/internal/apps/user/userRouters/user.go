package userRouters

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// Login 发起标准 OIDC 授权码流程。
// @Summary 发起 OIDC 登录
// @Description 获取登录地址，登录后返回指定页面。
// @Tags 登录
// @Param return_to query string false "登录后的站内路径" default(/)
// @Success 200 {object} userModels.LoginURLEnvelope
// @Failure 400 {object} response.EmptyEnvelope
// @Failure 429 {object} response.EmptyEnvelope
// @Router /v1/auth/oidc/login [get]
func Login(c echo.Context) error {
	if len(c.QueryParams()["return_to"]) > 1 {
		return response.Error(http.StatusBadRequest, "回跳地址只能提供一次")
	}
	target, browser, err := userSvc.BeginLogin(
		c.Request().Context(), c.QueryParam("return_to"), c.RealIP(),
	)
	if err != nil {
		return err
	}
	c.SetCookie(userUtils.Cookie(flowCookie(), browser, config.Config.OIDC.StateTTL))
	return response.Success(c, userModels.LoginURL{AuthorizationURL: target})
}

// Callback 接收登录回调。
// @Summary 接收 OIDC 回调
// @Tags 登录
// @Param code query string false "授权码，与 error 二选一"
// @Param state query string true "一次性登录状态"
// @Param error query string false "身份提供方错误代码"
// @Success 200 {object} userModels.LoginResultEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Router /v1/auth/oidc/callback [get]
func Callback(c echo.Context) error {
	// 清除登录流程 Cookie。
	c.SetCookie(userUtils.Cookie(flowCookie(), "", 0))
	query := c.QueryParams()
	if len(query["state"]) != 1 || len(query["code"]) > 1 || len(query["error"]) > 1 ||
		(len(query["code"]) == 1) == (len(query["error"]) == 1) {
		return response.Error(http.StatusUnauthorized, "登录回调参数无效")
	}
	cookie, err := c.Cookie(flowCookie())
	if err != nil {
		return response.Error(http.StatusUnauthorized, "登录请求已失效，请重新登录")
	}
	ctx := c.Request().Context()
	raw, target, err := userSvc.FinishLogin(
		ctx, c.QueryParam("state"), cookie.Value, c.QueryParam("code"), c.QueryParam("error"),
	)
	if err != nil {
		return err
	}
	c.SetCookie(userUtils.Cookie(config.Config.Session.CookieName, raw, config.Config.Session.TTL))
	return response.Success(c, userModels.LoginResult{ReturnTo: target})
}

// Logout 退出当前本地会话。
// @Summary 退出登录
// @Tags 登录
// @Success 200 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Param X-CSRF-Protection header string true "来源保护标记，固定为 1" default(1)
// @Router /v1/auth/logout [post]
func Logout(c echo.Context) error {
	if err := userSvc.Logout(c.Request().Context()); err != nil {
		return err
	}
	c.SetCookie(userUtils.Cookie(config.Config.Session.CookieName, "", 0))
	return response.Success[any](c, nil)
}

// Info 返回当前账号资料。
// @Summary 查询当前用户
// @Tags 用户
// @Success 200 {object} userModels.InfoEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/user-info [get]
func Info(c echo.Context) error {
	return response.Success(c, userUtils.Info(c.Request().Context()))
}

func flowCookie() string { return config.Config.Session.CookieName + "_oidc" }
