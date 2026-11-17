FROM --platform=$BUILDPLATFORM golang:1.26.10-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
COPY internal/ ./internal/
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -mod=readonly -tags timetzdata -trimpath -o /out/iwiki .

FROM scratch
WORKDIR /app
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /out/iwiki ./iwiki
USER 65532:65532
EXPOSE 8020
ENTRYPOINT ["/app/iwiki"]
CMD ["api", "--config", "/app/config.yaml"]
