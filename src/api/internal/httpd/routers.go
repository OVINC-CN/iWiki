package httpd

import (
	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/cos/cosRouters"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docRouters"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/home/homeRouters"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/permission/permissionRouters"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userRouters"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

func register(engine *echo.Echo) {
	engine.GET("/health", homeRouters.Health)
	engine.GET("/ready", homeRouters.Ready)
	v1 := engine.Group("/v1")
	v1.GET("/auth/oidc/login", userRouters.Login)
	v1.GET("/auth/oidc/callback", userRouters.Callback)
	v1.POST("/auth/logout", userRouters.Logout)
	v1.GET("/user-info", userRouters.Info)
	v1.GET("/home", homeRouters.Home)
	v1.GET("/features", homeRouters.Features)
	v1.GET("/permissions", permissionRouters.List)
	v1.GET("/docs", docRouters.List)
	v1.POST("/docs", docRouters.Create)
	v1.GET("/docs/:id", docRouters.Detail)
	v1.PUT("/docs/:id", docRouters.Update)
	v1.DELETE("/docs/:id", docRouters.Delete)
	v1.GET("/tags", docRouters.Tags)
	v1.GET("/tags/bound", docRouters.BoundTags)
	v1.POST("/cos/temp-secret", cosRouters.TempSecret)
	if config.Config.App.Debug {
		v1.GET("/swagger/*", echoSwagger.WrapHandler)
	}
}
