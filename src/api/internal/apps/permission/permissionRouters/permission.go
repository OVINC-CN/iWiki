package permissionRouters

import (
	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// List 查询当前登录账号的有效权限。
// @Summary 查询当前权限
// @Tags 权限
// @Success 200 {object} permissionModels.ListEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/permissions [get]
func List(c echo.Context) error {
	permissions, err := permissionSvc.List(c.Request().Context())
	if err != nil {
		return err
	}
	return response.Success(c, permissions)
}
