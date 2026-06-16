# Nginx Front Door

This config puts the app on port `4000` and proxies `/api/*` to the local Node API on port `3001`.

## Assumptions

- The production build is already available in `dist/`
- The API server is running separately on `127.0.0.1:3001`

## Install

Copy `thetower.conf` into your nginx config directory, for example:

```bash
cp nginx/thetower.conf /etc/nginx/conf.d/thetower.conf
nginx -t
sudo systemctl reload nginx
```

## Run order

1. Build the app: `npm run build`
2. Start the API: `npm run api`
3. Start or reload nginx on port `4000`

## Notes

- This keeps the site and API separated.
- nginx serves the built frontend and proxies API calls.
- If you move the repo, update the `root` path in `thetower.conf`.
