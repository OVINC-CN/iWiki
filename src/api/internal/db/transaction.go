package db

import (
	"context"
	"errors"

	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"

	"github.com/OVINC-CN/iWiki/src/api/internal/config"
)

// Transaction 执行事务，并在锁冲突回滚后重试。
func Transaction(ctx context.Context, operation func(*gorm.DB) error) error {
	for attempt := 0; ; attempt++ {
		if err := ctx.Err(); err != nil {
			return err
		}
		err := DB().WithContext(ctx).Transaction(operation)
		var conflict *mysql.MySQLError
		if attempt >= config.Config.MySQL.TransactionRetries ||
			!errors.As(err, &conflict) || (conflict.Number != 1213 && conflict.Number != 1205) {
			return err
		}
	}
}
