package docRouters

import (
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docSvc"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
	"github.com/OVINC-CN/iWiki/src/api/internal/request"
	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// List 查询已登录用户可见的文档。
// @Summary 查询文档列表
// @Description 标签取并集；同一字段须包含全部关键词，多个搜索字段取并集。
// @Tags 文档
// @Param page query int false "页码，从 1 开始" default(1)
// @Param size query int false "每页条数，默认 10、最大 100"
// @Param tags query []string false "标签名称" collectionFormat(multi)
// @Param keywords query []string false "关键词" collectionFormat(multi)
// @Success 200 {object} docModels.PageEnvelope
// @Failure 400 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 404 {object} response.EmptyEnvelope
// @Router /v1/docs [get]
func List(c echo.Context) error {
	page, err := request.Integer(c, "page", 1)
	if err != nil {
		return err
	}
	size, err := request.Integer(c, "size", config.Config.HTTP.DefaultPageSize)
	if err != nil {
		return err
	}
	result, err := docSvc.List(c.Request().Context(), docModels.Search{
		Page: page, Size: size,
		Tags: nonempty(c.QueryParams()["tags"]), Keywords: nonempty(c.QueryParams()["keywords"]),
	})
	if err != nil {
		return err
	}
	return response.Success(c, result)
}

// Detail 查询详情并记录一次阅读。
// @Summary 查询文档详情
// @Tags 文档
// @Param id path string true "文档编号"
// @Success 200 {object} docModels.DetailEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Failure 404 {object} response.EmptyEnvelope
// @Router /v1/docs/{id} [get]
func Detail(c echo.Context) error {
	id, err := request.ID(c)
	if err != nil {
		return err
	}
	result, err := docSvc.Detail(c.Request().Context(), id)
	if err != nil {
		return err
	}
	return response.Success(c, result)
}

// Create 创建文档并绑定标签。
// @Summary 创建文档
// @Tags 文档
// @Accept json
// @Param body body docModels.EditRequest true "文档资料"
// @Success 200 {object} docModels.IDEnvelope
// @Failure 400 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Failure 413 {object} response.EmptyEnvelope
// @Param X-CSRF-Protection header string true "来源保护标记，固定为 1" default(1)
// @Router /v1/docs [post]
func Create(c echo.Context) error { return save(c, "") }

// Update 完整修改本人文档。
// @Summary 修改文档
// @Tags 文档
// @Accept json
// @Param id path string true "文档编号"
// @Param body body docModels.EditRequest true "完整文档资料"
// @Success 200 {object} docModels.IDEnvelope
// @Failure 400 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Failure 404 {object} response.EmptyEnvelope
// @Failure 413 {object} response.EmptyEnvelope
// @Param X-CSRF-Protection header string true "来源保护标记，固定为 1" default(1)
// @Router /v1/docs/{id} [put]
func Update(c echo.Context) error {
	id, err := request.ID(c)
	if err != nil {
		return err
	}
	return save(c, id)
}

func save(c echo.Context, id string) error {
	var input docModels.EditRequest
	if err := request.JSON(c, &input); err != nil {
		return err
	}
	result, err := docSvc.Save(c.Request().Context(), id, input)
	if err != nil {
		return err
	}
	return response.Success(c, result)
}

// Delete 删除本人文档并同步清理无引用标签。
// @Summary 删除文档
// @Tags 文档
// @Param id path string true "文档编号"
// @Success 200 {object} response.EmptyEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Failure 403 {object} response.EmptyEnvelope
// @Failure 404 {object} response.EmptyEnvelope
// @Param X-CSRF-Protection header string true "来源保护标记，固定为 1" default(1)
// @Router /v1/docs/{id} [delete]
func Delete(c echo.Context) error {
	id, err := request.ID(c)
	if err != nil {
		return err
	}
	if err := docSvc.Delete(c.Request().Context(), id); err != nil {
		return err
	}
	return response.Success[any](c, nil)
}

// Tags 查询全部标签。
// @Summary 查询全部标签
// @Tags 标签
// @Success 200 {object} docModels.TagsEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/tags [get]
func Tags(c echo.Context) error { return tags(c, false) }

// BoundTags 查询至少绑定一篇文档的标签。
// @Summary 查询已绑定标签
// @Tags 标签
// @Success 200 {object} docModels.TagsEnvelope
// @Failure 401 {object} response.EmptyEnvelope
// @Router /v1/tags/bound [get]
func BoundTags(c echo.Context) error { return tags(c, true) }

func tags(c echo.Context, bound bool) error {
	result, err := docSvc.Tags(c.Request().Context(), bound)
	if err != nil {
		return err
	}
	return response.Success(c, result)
}

func nonempty(values []string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}
