# Cloudinary Setup Guide

## Where to Add Cloudinary Credentials

### 1. For Local Development (Optional)

If you want to test cloud storage locally, create a `.env` file in the `server` directory:

**Location:** `server/.env`

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Note:** If you don't add these locally, files will be stored in the `uploads/resumes/` folder (which is fine for development).

---

### 2. For Production (Render/Heroku/etc.) - **REQUIRED**

You **must** add Cloudinary credentials in your deployment platform's environment variables.

#### On Render:

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **Web Service** (your backend server)
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add these three variables:

   ```
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ```

6. Click **Save Changes**
7. Your service will automatically redeploy

#### On Heroku:

1. Go to your Heroku dashboard
2. Select your app
3. Go to **Settings** → **Config Vars**
4. Click **Reveal Config Vars**
5. Add:

   ```
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ```

6. Click **Save**

#### On Railway:

1. Go to your Railway project
2. Select your service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable one by one:

   ```
   CLOUDINARY_CLOUD_NAME = your_cloud_name
   CLOUDINARY_API_KEY = your_api_key
   CLOUDINARY_API_SECRET = your_api_secret
   ```

---

## How to Get Cloudinary Credentials

1. **Sign up for Cloudinary** (free): https://cloudinary.com/users/register/free
2. **Log in** to your dashboard: https://console.cloudinary.com
3. **Copy your credentials** from the dashboard:
   - **Cloud Name**: Found at the top of the dashboard
   - **API Key**: Found in the dashboard
   - **API Secret**: Click "Show" to reveal it

---

## Quick Setup Checklist

- [ ] Sign up for Cloudinary account
- [ ] Get your Cloud Name, API Key, and API Secret
- [ ] Add credentials to Render/Heroku/Railway environment variables
- [ ] Redeploy your service
- [ ] Test file upload - it should now work in production!

---

## Important Notes

- **Never commit** `.env` files to Git (they're already in `.gitignore`)
- **Never share** your API Secret publicly
- The code will automatically use Cloudinary if credentials are found
- Without credentials, it falls back to local storage (which won't work in production)

---

## Testing

After adding credentials and redeploying:

1. Try uploading a resume from the profile page
2. Try uploading a resume with a collaboration request
3. Check that the file URL starts with `https://res.cloudinary.com/...`
4. Files should persist even after server restarts!

