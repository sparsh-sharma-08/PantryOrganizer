# Google OAuth Setup Guide

Follow these steps to set up Google OAuth for your Pantry Organizer app:

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"** as the application type
4. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://your-domain.com/api/auth/google/callback`
5. Click **"Create"**

## Step 3: Get Your Credentials

After creation, you'll get:
- **Client ID** (copy this)
- **Client Secret** (copy this)

## Step 4: Add to Environment Variables

Add these to your `.env` file:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=your-random-session-secret
```

## Step 5: Test

1. Restart your server
2. Try logging in with Google
3. You should be redirected to Google's consent screen

## Troubleshooting

- **"Invalid redirect URI"**: Make sure the redirect URI in Google Console matches exactly
- **"Unknown authentication strategy"**: Make sure you've restarted the server after adding credentials
- **CORS issues**: Ensure your `FRONTEND_URL` environment variable is set correctly

## Security Notes

- Never commit your `GOOGLE_CLIENT_SECRET` to version control
- Use different credentials for development and production
- Regularly rotate your secrets 