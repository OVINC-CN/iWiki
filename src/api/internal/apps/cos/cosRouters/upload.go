package cosRouters

import (
	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/cos/cosModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/cos/cosSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/request"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// TempSecret 申请限定对象和大小的临时上传凭据。
// @Summary 获取 COS 临时上传凭据
// @Tags 上传
// @Accept json
// @Param body body cosModels.Request true "文件信息"
// @Success 200 {object} cosModels.CredentialEnvelope
// @Failure 400 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Failure 502 {object} response.EmptyEnvelope
// @Failure 503 {object} response.EmptyEnvelope
// @Param X-CSRF-Protection header string true "来源保护标记，固定为 1" default(1)
// @Router /v1/cos/temp-secret [post]
func TempSecret(c echo.Context) error {
	var input cosModels.Request
	if err := request.JSON(c, &input); err != nil {
		return err
	}
	result, err := cosSvc.Issue(c.Request().Context(), input.Filename)
	if err != nil {
		return err
	}
	return response.Success(c, result)
}
