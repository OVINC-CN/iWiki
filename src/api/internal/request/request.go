package request

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"
	"strconv"
	"unicode"
	"unicode/utf8"

	"github.com/labstack/echo/v4"

	"github.com/OVINC-CN/iWiki/src/api/internal/response"
)

// JSON 解码并校验请求体。
func JSON(c echo.Context, destination any) error {
	contentType, _, err := mime.ParseMediaType(c.Request().Header.Get(echo.HeaderContentType))
	if err != nil || contentType != echo.MIMEApplicationJSON {
		return response.Error(http.StatusUnsupportedMediaType, "请求内容必须是 JSON")
	}
	decoder := json.NewDecoder(c.Request().Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return response.Error(http.StatusBadRequest, "请求 JSON 格式或字段无效")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return response.Error(http.StatusBadRequest, "请求只能包含一个 JSON 对象")
	}
	return nil
}

// Integer 读取正整数查询参数。
func Integer(c echo.Context, name string, fallback int) (int, error) {
	values, exists := c.QueryParams()[name]
	if !exists {
		return fallback, nil
	}
	if len(values) != 1 || values[0] == "" {
		return 0, response.Error(http.StatusBadRequest, "分页参数无效")
	}
	value, err := strconv.Atoi(values[0])
	if err != nil || value < 1 {
		return 0, response.Error(http.StatusBadRequest, "分页参数无效")
	}
	return value, nil
}

// ID 校验文档编号。
func ID(c echo.Context) (string, error) {
	value := c.Param("id")
	if value == "" || !utf8.ValidString(value) || utf8.RuneCountInString(value) > 32 {
		return "", response.Error(http.StatusBadRequest, "文档编号无效")
	}
	for _, char := range value {
		if unicode.IsControl(char) {
			return "", response.Error(http.StatusBadRequest, "文档编号无效")
		}
	}
	return value, nil
}
