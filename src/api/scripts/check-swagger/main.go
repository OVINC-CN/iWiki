package main

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
)

func main() {
	if err := check(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func check() error {
	// 核对路由和接口文档。
	source, err := os.ReadFile("internal/httpd/routers.go")
	if err != nil {
		return fmt.Errorf("route source read failed: %w", err)
	}
	document, err := os.ReadFile("internal/httpd/docs/swagger.json")
	if err != nil {
		return fmt.Errorf("swagger document read failed: %w", err)
	}
	var spec struct {
		Paths map[string]map[string]json.RawMessage `json:"paths"`
	}
	if err := json.Unmarshal(document, &spec); err != nil {
		return fmt.Errorf("invalid Swagger document: %w", err)
	}
	pattern := regexp.MustCompile(`(engine|v1)\.(GET|POST|PUT|DELETE)\("([^"]+)"`)
	registered := make(map[string]bool)
	for _, match := range pattern.FindAllStringSubmatch(string(source), -1) {
		path := match[3]
		if strings.Contains(path, "swagger") {
			continue
		}
		if match[1] == "v1" {
			path = "/v1" + path
		}
		path = strings.ReplaceAll(path, ":id", "{id}")
		method := strings.ToLower(match[2])
		registered[method+" "+path] = true
		if _, exists := spec.Paths[path][method]; !exists {
			return fmt.Errorf("missing Swagger documentation: %s %s", method, path)
		}
	}
	for path, methods := range spec.Paths {
		for method := range methods {
			if !registered[method+" "+path] {
				return fmt.Errorf("swagger references an unregistered route: %s %s", method, path)
			}
		}
	}
	fmt.Println("Routes and Swagger documentation are consistent")
	return nil
}
