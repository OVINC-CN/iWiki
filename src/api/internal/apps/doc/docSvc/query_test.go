package docSvc

import (
	"context"
	"reflect"
	"strings"
	"testing"

	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/OVINC-CN/iWiki/src/api/internal/apps/doc/docModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userModels"
	"github.com/OVINC-CN/iWiki/src/api/internal/apps/user/userUtils"
	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

func TestSearchPreservesVisibilityAndContainsSemantics(t *testing.T) {
	// DryRun 不连接数据库，检查实际 GORM 查询及参数绑定。
	connection, err := gorm.Open(gormmysql.New(gormmysql.Config{
		DSN: "unused:unused@tcp(localhost:3306)/unused", SkipInitializeWithVersion: true,
	}), &gorm.Config{DisableAutomaticPing: true, DryRun: true, Logger: gormlogger.Discard})
	if err != nil {
		t.Fatal("Failed to create the query inspection connection")
	}
	pool, err := connection.DB()
	if err != nil {
		t.Fatal("Failed to obtain the query inspection connection")
	}
	t.Cleanup(func() { _ = pool.Close() })
	previous := config.Config.Document.SearchType
	config.Config.Document.SearchType = "all"
	t.Cleanup(func() { config.Config.Document.SearchType = previous })
	ctx := userUtils.WithIdentity(context.Background(), userUtils.Identity{
		User: userModels.User{Username: "alice"},
	})
	query := filtered(connection.WithContext(ctx), ctx, docModels.Search{
		Keywords: []string{"100%_", "第二词"},
	}).Find(&[]docModels.Doc{})
	sql := query.Statement.SQL.String()
	for _, expected := range []string{
		"(doc_doc.owner_id = ? OR doc_doc.is_public = ?)",
		"doc_doc.title LIKE BINARY ? ESCAPE '!' AND doc_doc.title LIKE BINARY ? ESCAPE '!'",
		"doc_doc.content LIKE BINARY ? ESCAPE '!' AND doc_doc.content LIKE BINARY ? ESCAPE '!'",
	} {
		if !strings.Contains(sql, expected) {
			t.Errorf("Missing visibility or search grouping: %s", expected)
		}
	}
	expected := []any{"alice", true, "%100!%!_%", "%第二词%", "%100!%!_%", "%第二词%"}
	if !reflect.DeepEqual(query.Statement.Vars, expected) {
		t.Fatal("Search must bind parameters and escape wildcard characters")
	}
}
