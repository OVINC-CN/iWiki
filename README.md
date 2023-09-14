## iWiki

iWiki, a document management system that combines blogs and knowledge bases.

### Deployment

#### Method 1: Deploy on Vercel (Recommended)

Fork this repository and deploy it using [Vercel](https://vercel.com).

```shell
# Modify deployment settings
Modify `Build Command` to `yarn build`   
Modify `Install Command` to `yarn`
```

```shell
# Add environment variables
SITE_URL=<SITE URL>
BACKEND_URL=<API URL>
OVINC_WEB_URL=<OVINC WEB URL>
OVINC_URL=<OVINC UNION API URL>
```

#### Method 2: Manual Packaging and Deployment

This deployment method requires a static resource server of your own, or you can host the static resources on COS, OSS, S3.

```shell
SITE_URL=<SITE URL> \
BACKEND_URL=<API URL> \
OVINC_WEB_URL=<OVINC WEB URL> \
OVINC_URL=<OVINC UNION API URL> \
yarn && yarn build
```
