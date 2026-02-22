# Deployment Notes - IdeaConnect

## ✅ Solutions Implemented

### File Storage
The code now **automatically** uses:
- **Cloudinary** (cloud storage) if configured via environment variables
- **Local filesystem** if Cloudinary is not configured (for development)

### Email Verification
The code now **automatically** uses:
- **Nodemailer** (email service) if configured via environment variables
- **Returns verification link in response** if email is not configured (for development)

## 🚀 Setup for Production (Render/Heroku/etc.)

### Step 1: Sign up for Cloudinary (Free)

1. Go to https://cloudinary.com
2. Sign up for a free account
3. You'll get 25GB storage and 25GB monthly bandwidth (free tier)

### Step 2: Get Your Credentials

From your Cloudinary dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

### Step 3: Add Environment Variables in Render

In your Render dashboard, go to your service → Environment → Add Environment Variable:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Step 4: Redeploy

After adding the environment variables, redeploy your service. The resume upload will now automatically use Cloudinary!

## 📝 How It Works

- **Development (no Cloudinary)**: Files saved to `uploads/resumes/` folder
- **Production (with Cloudinary)**: Files uploaded to Cloudinary cloud storage
- **Automatic detection**: The code automatically detects if Cloudinary is configured

## ✅ Benefits

- ✅ Works locally without any setup
- ✅ Works in production with Cloudinary
- ✅ Files persist across deployments
- ✅ Works with multiple server instances
- ✅ No code changes needed - just add environment variables!

## 📧 Email Verification Setup

### Option 1: Gmail (Recommended for Development)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
3. Add to your `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@ideaconnect.com
```

### Option 2: Other Email Providers

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@ideaconnect.com
```

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@ideaconnect.com
```

**Custom SMTP:**
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@ideaconnect.com
```

### Step 3: Add Environment Variables in Render/Heroku

In your deployment dashboard, add:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@ideaconnect.com
FRONTEND_URL=https://your-frontend-domain.com
```

### How It Works

- **With Email Configured**: Verification emails are sent automatically
- **Without Email Configured**: Verification link is returned in API response (development mode)
- **Automatic**: Code detects if email is configured and works accordingly

## 🔒 Security

- Files are stored securely in Cloudinary
- Only authenticated users can upload/view resumes
- File type validation (PDF, DOC, DOCX only)
- File size limit (5MB)
- Email verification tokens expire after 24 hours
- One-time use verification tokens

