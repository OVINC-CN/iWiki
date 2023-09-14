## iWiki

iWiki，博客、知识库一体的文档管理系统

### 部署

#### 方式一 Vercel 部署 (推荐)

Fork 此仓库后，使用 [Vercel](https://vercel.com) 部署

```
# 修改部署方式
修改 `Build Command` 为 `yarn build`   
修改 `Install Command` 为 `yarn`
```

```shell
# 增加环境变量
SITE_URL=<SITE URL>
BACKEND_URL=<API URL>
OVINC_WEB_URL=<OVINC WEB URL>
OVINC_URL=<OVINC UNION API URL>
```

#### 方式二 手动打包部署

此方式部署需要有自己的静态资源服务器，也可以将静态资源托管到 COS, OSS, S3

```shell
SITE_URL=<SITE URL> \
BACKEND_URL=<API URL> \
OVINC_WEB_URL=<OVINC WEB URL> \
OVINC_URL=<OVINC UNION API URL> \
yarn && yarn build
```
