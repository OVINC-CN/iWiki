<div align="center">
  <img src="statics/logo.png" width="120" alt="iWikiAPI Logo">
  <h1>iWikiAPI</h1>
  <p>
    <b>Backend API Service for iWiki</b>
  </p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/OVINC-CN/iWikiAPI" alt="License"></a>
  </p>
  <p>
    <a href="README.md">English</a> | <a href="README_CN.md">简体中文</a>
  </p>
</div>

## 📖 Introduction

iWikiAPI is the backend service for iWiki, providing robust API endpoints to manage wiki content. It is designed for performance and scalability, supporting containerized deployment and integration with modern cloud services.

## ✨ Features

*   **RESTful API**: Comprehensive API endpoints for wiki operations.
*   **Asynchronous Processing**: Integrated with Celery for handling background tasks efficiently.
*   **Container Ready**: Fully dockerized for easy deployment and scaling.
*   **Cloud Storage**: Built-in support for Tencent Cloud COS for media asset management.
*   **Secure**: Integration with OVINC UNION API for centralized authentication.

## 🛠 Tech Stack

*   **Language**: Python
*   **Framework**: Django
*   **Server**: UWSGI
*   **Database**: PostgreSQL / MySQL
*   **Cache**: Redis
*   **Task Queue**: Celery

## 🚀 Getting Started

### Prerequisites

*   Docker
*   Git

### Installation & Deployment

1.  **Clone the repository**

    ```bash
    git clone https://github.com/OVINC-CN/iWikiAPI.git
    cd iWikiAPI
    ```

2.  **Build the Docker Image**

    ```bash
    docker build . -t iwiki-api:latest
    ```

3.  **Configuration**

    Copy the example environment file and configure your settings:

    ```bash
    cp env.example .env
    ```

    Edit `.env` with your specific configurations:

    ```ini
    # UWSGI Configuration
    UWSGI_PROCESSES=2
    UWSGI_THREADS=10

    # Celery Worker
    WORKER_COUNT=2

    # System Config
    DEBUG=False
    LOG_LEVEL=INFO

    # App Authentication (Register in OVINC UNION API)
    APP_CODE=your_app_code
    APP_SECRET=your_app_secret

    # Host Configuration
    BACKEND_HOST=api.yourdomain.cn
    FRONTEND_URL=https://yourdomain.cn
    SESSION_COOKIE_DOMAIN=.yourdomain.cn
    OVINC_API_DOMAIN=https://api.yourdomain.cn

    # Database
    DB_NAME=iwiki
    DB_USER=root
    DB_PASSWORD=password
    DB_HOST=db_host
    DB_PORT=5432

    # Redis
    REDIS_HOST=redis_host
    REDIS_PORT=6379
    REDIS_PASSWORD=
    REDIS_DB=0

    # Object Storage (Tencent Cloud COS - Optional)
    QCLOUD_SECRET_ID=
    QCLOUD_SECRET_KEY=
    QCLOUD_COS_BUCKET=
    QCLOUD_COS_URL=
    ```

4.  **Run the Service**

    ```bash
    docker run --rm -itd --env-file=.env -p 8020:8020 iwiki-api:latest bin/run.sh
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
