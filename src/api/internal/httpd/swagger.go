package httpd

import (
	_ "embed"

	"github.com/swaggo/swag"
)

//go:embed docs/swagger.json
var swaggerJSON string

type swaggerDocument struct{}

func init() { swag.Register(swag.Name, swaggerDocument{}) }

func (swaggerDocument) ReadDoc() string { return swaggerJSON }
