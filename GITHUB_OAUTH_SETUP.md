# GitHub OAuth Setup Guide

Follow these steps to set up GitHub OAuth for your Pantry Organizer app:

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: Pantry Organizer
   - **Homepage URL**: 
     - For local development: `http://localhost:3000`
     - For production: `https://your-domain.com`
   - **Application description**: Smart kitchen management solution
   - **Authorization callback URL**:
     - For local development: `http://localhost:3000/api/auth/github/callback`
     - For production: `https://your-domain.com/api/auth/github/callback`

## Step 2: Get Your Credentials

After creating the OAuth app, you'll get:
- **Client ID** (copy this)
- **Client Secret** (click "Generate a new client secret" to get this)

## Step 3: Add to Environment Variables

Add these to your `.env` file:
```env
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## Step 4: Configure GitHub App Settings

1. Go back to your OAuth app settings
2. Under **"Permissions"**, make sure you have:
   - **Email addresses**: Read access (to get user's email)
   - **Profile**: Read access (to get user's name and profile info)

**Note**: If a user's email is not public on GitHub or they don't grant email access, the app will create a placeholder email address. This ensures the user can still sign up and use the app.

## Step 5: Test

1. Restart your server
2. Try logging in with GitHub
3. You should be redirected to GitHub's authorization screen

## Troubleshooting

- **"Invalid redirect URI"**: Make sure the callback URL in GitHub matches exactly
- **"Unknown authentication strategy"**: Make sure you've restarted the server after adding credentials
- **Email not available**: Make sure your GitHub account has a public email or you've granted email access
- **CORS issues**: Ensure your `FRONTEND_URL` environment variable is set correctly

## Security Notes

- Never commit your `GITHUB_CLIENT_SECRET` to version control
- Use different credentials for development and production
- Regularly rotate your secrets
- GitHub OAuth apps are public by default, but the client secret should remain private

## GitHub OAuth vs Google OAuth

- **GitHub**: Better for developer-focused applications
- **Google**: Better for general consumer applications
- Both provide similar functionality for authentication 