<div align="center">
  <img src="statics/logo.png" width="120" alt="iWikiAPI Logo">
  <h1>iWikiAPI</h1>
  <p>
    <b>iWiki 后端 API 服务</b>
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/OVINC-CN/iWikiAPI" alt="License"></a>
  </p>
  <p>
    <a href="README.md">English</a> | <a href="README_CN.md">简体中文</a>
  </p>
</div>

## 📖 简介

iWikiAPI 是 iWiki 的后端服务，提供强大的 API 接口用于管理 Wiki 内容。项目基于 Django 开发，注重性能与扩展性，支持容器化部署及主流云服务集成。

## ✨ 特性

*   **RESTful API**: 提供完善的 Wiki 管理接口。
*   **异步任务**: 集成 Celery 高效处理后台任务。
*   **容器化**: 支持 Docker 部署，易于扩展和迁移。
*   **云存储**: 内置腾讯云 COS 支持，方便管理媒体资源。
*   **安全认证**: 集成 OVINC UNION API 进行统一认证。

## 🛠 技术栈

*   **语言**: Python
*   **框架**: Django
*   **服务器**: UWSGI
*   **数据库**: PostgreSQL / MySQL
*   **缓存**: Redis
*   **任务队列**: Celery

## 🚀 快速开始

### 前置要求

*   Docker
*   Git

### 安装与部署

1.  **克隆仓库**

    ```bash
    git clone https://github.com/OVINC-CN/iWikiAPI.git
    cd iWikiAPI
    ```

2.  **构建 Docker 镜像**

    ```bash
    docker build . -t iwiki-api:latest
    ```

3.  **配置环境**

    复制示例配置文件并修改：

    ```bash
    cp env.example .env
    ```

    编辑 `.env` 文件填入你的配置信息：

    ```ini
    # UWSGI 配置 (PROCESSES 一般为 CPU 核心数，THREADS 建议为 5 * CPU)
    UWSGI_PROCESSES=2
    UWSGI_THREADS=10

    # Celery Worker 数量
    WORKER_COUNT=2

    # 系统配置 (生产环境请关闭 DEBUG)
    DEBUG=False
    LOG_LEVEL=INFO

    # 应用认证 (请先在 OVINC UNION API 中注册)
    APP_CODE=your_app_code
    APP_SECRET=your_app_secret

    # 域名配置
    BACKEND_HOST=api.yourdomain.cn
    FRONTEND_URL=https://yourdomain.cn
    SESSION_COOKIE_DOMAIN=.yourdomain.cn
    OVINC_API_DOMAIN=https://api.yourdomain.cn

    # 数据库配置
    DB_NAME=iwiki
    DB_USER=root
    DB_PASSWORD=password
    DB_HOST=db_host
    DB_PORT=5432

    # Redis 配置
    REDIS_HOST=redis_host
    REDIS_PORT=6379
    REDIS_PASSWORD=
    REDIS_DB=0

    # 对象存储 (腾讯云 COS - 选填)
    QCLOUD_SECRET_ID=
    QCLOUD_SECRET_KEY=
    QCLOUD_COS_BUCKET=
    QCLOUD_COS_URL=
    ```

4.  **启动服务**

    ```bash
    docker run --rm -itd --env-file=.env -p 8020:8020 iwiki-api:latest bin/run.sh
    ```

## 🤝 贡献

欢迎提交 Pull Request 或 Issue 来改进本项目。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。
