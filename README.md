# TikTok Dashboard

A dashboard project for TikTok Login, fetching channel and video data from the TikTok API, and exporting the result to Excel.

## Features

- Login with TikTok
- Fetch channel information
- Fetch video list from TikTok
- Display dashboard data on the frontend
- Export data to Excel

## Tech Stack

### Frontend
- Angular
- Nx Workspace

### Backend
- NestJS
- Axios

### Other
- TikTok Open API
- Excel export

## Project Structure

```text
apps/
  tiktok_dashboard/   # Angular frontend
backend/              # NestJS backend
certs/                # local HTTPS certificate for callback
```

## Environment Variables

Create a `.env` file for the backend and configure values like this:

```env
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://mayson.com:3443/api/tiktok/callback
TIKTOK_AUTH_STATE=test123
FRONTEND_URL=http://localhost:4200
```

## Local Hosts

For the local callback domain, add this entry to your `hosts` file:

```txt
127.0.0.1 mayson.com
```

Windows path:

```txt
C:\Windows\System32\drivers\etc\hosts
```

## HTTPS Certificate for Callback

TikTok redirect callback uses a local HTTPS domain.

This project uses a certificate for `mayson.com` stored in the `certs/` folder.

Example:

```text
certs/
  mayson.com.pem
  mayson.com-key.pem
```

## TikTok Redirect URL

Set this value in the TikTok Developer Portal:

```txt
https://mayson.com:3443/api/tiktok/callback
```

It must match `TIKTOK_REDIRECT_URI` in the `.env` file.

## Run Project

### Run Frontend

```bash
npx nx serve tiktok_dashboard
```

Frontend runs at:

```txt
http://localhost:4200
```

### Run Backend

```bash
npx nx serve backend
```

Backend runs at:

```txt
http://localhost:3000/api
```

There is also a local HTTPS callback server at:

```txt
https://mayson.com:3443/api/tiktok/callback
```

## Login Flow

1. The user clicks `Login with TikTok` on the frontend
2. The frontend opens the backend route `/api/tiktok/login`
3. The backend redirects to TikTok authorization
4. TikTok redirects back to `https://mayson.com:3443/api/tiktok/callback`
5. The callback server forwards the `code` to `/api/tiktok/exchange-token`
6. The backend exchanges the code for an access token
7. The backend redirects back to the frontend
8. The user clicks `Load Videos` to fetch dashboard data

## API Endpoints

### Login
```http
GET /api/tiktok/login
```

### Exchange Token
```http
GET /api/tiktok/exchange-token?code=...
```

### Get Videos Dashboard
```http
GET /api/tiktok/videos
```

## Frontend Dashboard

The main page supports:

- Login with TikTok
- Load Videos
- Export Excel

Displayed fields include:

- Cover
- Id
- Title
- Description
- Create Time
- Views
- Likes
- Comments
- Shares
- Duration
- Link

## Notes

- The access token is currently stored in backend memory only. If the backend restarts, login is required again.
- If the TikTok API does not return all videos, that may be a TikTok API limitation rather than a frontend/backend bug.
- To switch TikTok accounts more easily, try using `disable_auto_auth=1` in the authorization URL.
- If `CLIENT_SECRET` was exposed, rotate it immediately in the TikTok Developer Portal.

## Useful Commands

Show all projects in the workspace:

```bash
npx nx show projects
```

Show frontend targets:

```bash
npx nx show project tiktok_dashboard
```

Show backend targets:

```bash
npx nx show project backend
```

Create a production build for the frontend:

```bash
npx nx build tiktok_dashboard
```

## Current Status

The project currently supports:

- TikTok Login
- Local HTTPS redirect callback
- Token exchange
- Dashboard data loading
- Excel export

Production hardening not yet done:

- Persist token to database or storage
- Refresh token flow
- Better error handling
- Production deployment configuration
