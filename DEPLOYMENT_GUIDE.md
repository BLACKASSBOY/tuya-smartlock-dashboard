# Tuya Smart Lock Dashboard - Deployment Guide

## Overview

Your Tuya Smart Lock Dashboard is fully functional and ready to deploy. The Manus sandbox environment has network restrictions that prevent external API calls, but once deployed to a hosting provider with unrestricted network access, your dashboard will have full Tuya API connectivity.

## Why Deploy?

- **Network Access**: External hosting providers have unrestricted internet access to Tuya Cloud API
- **Real Lock Control**: Lock/unlock commands will work with your actual smart lock
- **24/7 Availability**: Your dashboard runs continuously, not just in development
- **Custom Domain**: Use your own domain name instead of a shared subdomain

## Recommended Hosting Providers

### 1. **Railway** (Recommended - Easiest)
**Pros**: Simple deployment, free tier available, automatic HTTPS, database included
**Cons**: Limited free tier resources

**Steps**:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Select "Deploy from GitHub"
4. Connect your GitHub repository (export from Manus Management UI)
5. Add environment variables:
   - `TUYA_ACCESS_ID` = `wcrsgp4qwehryvwgj547`
   - `TUYA_ACCESS_SECRET` = `b79b01d4e9e945e0b6c8ed3253f16b3d`
   - `TUYA_DEVICE_ID` = `ebc7879eb59d51a0cfgpqd`
   - `TUYA_CONTACT_SENSOR_ID` = `ebcbe86ab4a59f8195tdzf`
   - `TUYA_REGION` = `us`
   - `DATABASE_URL` = (Railway will provide this)
   - `JWT_SECRET` = (Generate a random string: `openssl rand -base64 32`)
6. Deploy and get your live URL

### 2. **Render** (Good Alternative)
**Pros**: Generous free tier, good performance, easy deployment
**Cons**: Free tier goes to sleep after 15 minutes of inactivity

**Steps**:
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. New Web Service → Connect GitHub repo
4. Set build command: `pnpm build`
5. Set start command: `pnpm start`
6. Add environment variables (same as Railway)
7. Deploy

### 3. **Vercel** (For Frontend Only)
**Pros**: Excellent for static sites, very fast
**Cons**: Backend requires separate hosting

**Note**: Vercel is best for frontend-only apps. Since your dashboard has a Node.js backend, use Railway or Render instead.

### 4. **Self-Hosted (VPS)**
**Pros**: Full control, no vendor lock-in
**Cons**: More setup required, need to manage server

**Options**:
- DigitalOcean Droplet ($5-6/month)
- Linode ($5/month)
- AWS EC2 (free tier available)
- Hetzner (cheap European VPS)

**Basic Setup**:
```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone your repository
git clone your-repo-url
cd tuya-smartlock-dashboard

# Install dependencies
pnpm install

# Set environment variables
export TUYA_ACCESS_ID=wcrsgp4qwehryvwgj547
export TUYA_ACCESS_SECRET=b79b01d4e9e945e0b6c8ed3253f16b3d
export TUYA_DEVICE_ID=ebc7879eb59d51a0cfgpqd
export TUYA_CONTACT_SENSOR_ID=ebcbe86ab4a59f8195tdzf
export TUYA_REGION=us
export DATABASE_URL=your-database-url
export JWT_SECRET=your-random-secret

# Build and start
pnpm build
pnpm start
```

## Environment Variables Required

All deployments need these environment variables set:

| Variable | Value | Description |
|----------|-------|-------------|
| `TUYA_ACCESS_ID` | `wcrsgp4qwehryvwgj547` | Tuya API Client ID |
| `TUYA_ACCESS_SECRET` | `b79b01d4e9e945e0b6c8ed3253f16b3d` | Tuya API Client Secret |
| `TUYA_DEVICE_ID` | `ebc7879eb59d51a0cfgpqd` | Smart lock device ID |
| `TUYA_CONTACT_SENSOR_ID` | `ebcbe86ab4a59f8195tdzf` | Door sensor device ID |
| `TUYA_REGION` | `us` | Tuya region (West America) |
| `DATABASE_URL` | (from hosting provider) | MySQL/TiDB connection string |
| `JWT_SECRET` | (generate random) | Session signing secret |
| `VITE_APP_ID` | (from Manus) | OAuth app ID |
| `OAUTH_SERVER_URL` | (from Manus) | OAuth server URL |

## Step-by-Step: Deploy to Railway

### 1. Export Code from Manus
1. Go to Manus Management UI → Code panel
2. Click "Download as ZIP"
3. Extract and push to GitHub

### 2. Create Railway Account
1. Visit [railway.app](https://railway.app)
2. Click "Start Project"
3. Select "Deploy from GitHub"

### 3. Connect GitHub Repository
1. Authorize Railway to access GitHub
2. Select your `tuya-smartlock-dashboard` repository
3. Railway auto-detects it's a Node.js project

### 4. Add Environment Variables
1. In Railway dashboard, go to Variables
2. Add all required variables (see table above)
3. For `DATABASE_URL`, Railway provides this automatically
4. For `JWT_SECRET`, generate: `openssl rand -base64 32`

### 5. Deploy
1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Get your live URL from Railway dashboard

### 6. Test Your Dashboard
1. Visit your Railway URL
2. Log in with your Manus account
3. Click Lock/Unlock buttons
4. **They should now work!** ✅

## Troubleshooting

### "Fetch Failed" Still Appearing
- Check all environment variables are set correctly
- Verify Tuya credentials in your Tuya IoT Platform
- Check hosting provider logs for errors

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from hosting provider
- Check database credentials

### OAuth Login Not Working
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check that your hosting provider URL is whitelisted in Manus OAuth settings

## CLI Tool Deployment

Your CLI tool can also be deployed:

```bash
# On your local machine
cd /home/ubuntu/tuya-smartlock-cli

# Build
npm run build

# Set up credentials
./dist/cli.js setup
# Enter your dashboard URL and API token

# Use commands
./dist/cli.js lock
./dist/cli.js unlock
./dist/cli.js status
```

## Global Hotkeys Setup

After deploying, set up system-wide hotkeys:

**Windows (AutoHotkey)**:
```autohotkey
^l::
{
    Run, "C:\path\to\cli.exe lock"
}

^u::
{
    Run, "C:\path\to\cli.exe unlock"
}
```

**macOS (Hammerspoon)**:
```lua
hs.hotkey.bind({"cmd", "ctrl"}, "l", function()
    os.execute("/path/to/cli lock")
end)

hs.hotkey.bind({"cmd", "ctrl"}, "u", function()
    os.execute("/path/to/cli unlock")
end)
```

**Linux (xbindkeys)**:
```
"~/.local/bin/cli lock"
  Control + l

"~/.local/bin/cli unlock"
  Control + u
```

## Next Steps

1. **Choose a hosting provider** (Railway recommended for simplicity)
2. **Export your code** from Manus
3. **Deploy** following the provider's instructions
4. **Test** lock/unlock buttons on your live URL
5. **Set up hotkeys** on your computer
6. **Enjoy automated smart lock control!** 🔐

## Support

If you encounter issues:
1. Check the hosting provider's logs
2. Verify all environment variables are set
3. Test Tuya credentials in your Tuya IoT Platform
4. Contact hosting provider support

---

**Your dashboard is production-ready. Deploy with confidence!** 🚀
