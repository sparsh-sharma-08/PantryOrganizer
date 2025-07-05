# 🚀 Render Deployment Guide for Pantry Organizer

## Prerequisites
- GitHub account with your PantryOrganizer repository
- Gmail account for email service
- Google Cloud Console account (for OAuth)
- GitHub Developer account (for OAuth)

## Step 1: Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Complete the verification process

## Step 2: Connect Your Repository

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub account if not already connected
4. Select your `PantryOrganizer` repository
5. Click "Connect"

## Step 3: Configure Your Web Service

### Basic Settings
- **Name**: `pantry-organizer` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (default)

### Build & Deploy Settings
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or choose paid for better performance)

## Step 4: Set Environment Variables

Click on "Environment" tab and add these variables:

### Required Variables
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-very-strong-32-character-secret-here
SESSION_SECRET=your-very-strong-32-character-session-secret
FRONTEND_URL=https://your-app-name.onrender.com
```

### Email Configuration
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SUPPORT_EMAIL=support@yourdomain.com
```

### OAuth Configuration (Optional)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Additional Settings
```
LOG_LEVEL=info
```

## Step 5: Generate Strong Secrets

### Generate JWT Secret
```bash
# Run this in your terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate Session Secret
```bash
# Run this in your terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Set Up Gmail App Password

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate a new app password for "Mail"
5. Use this password as `EMAIL_PASS`

## Step 7: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to their servers

3. Wait for deployment to complete (usually 2-5 minutes)

## Step 8: Verify Deployment

1. Once deployed, click on your app URL
2. Test the health endpoint: `https://your-app.onrender.com/api/health`
3. You should see:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": 123.456,
     "environment": "production",
     "version": "1.0.0"
   }
   ```

## Step 9: Set Up OAuth (Optional)

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set Application Type to "Web application"
6. Add Authorized JavaScript origins:
   - `https://your-app-name.onrender.com`
7. Add Authorized redirect URIs:
   - `https://your-app-name.onrender.com/api/auth/google/callback`
8. Copy Client ID and Client Secret to Render environment variables

### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: Pantry Organizer
   - Homepage URL: `https://your-app-name.onrender.com`
   - Authorization callback URL: `https://your-app-name.onrender.com/api/auth/github/callback`
4. Copy Client ID and Client Secret to Render environment variables

## Step 10: Test Your Application

1. **Test Registration**: Create a new account
2. **Test Login**: Login with email/password
3. **Test OAuth**: Try Google/GitHub login
4. **Test Features**: Add items, create shopping lists
5. **Test Contact Form**: Send a test message

## Step 11: Set Up Custom Domain (Optional)

1. In Render dashboard, go to your web service
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Add your domain
5. Update DNS records as instructed
6. Update `FRONTEND_URL` environment variable

## Troubleshooting

### Common Issues

**Build Fails**
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**App Won't Start**
- Check environment variables are set correctly
- Verify PORT is set to 10000
- Check application logs

**OAuth Not Working**
- Verify callback URLs are correct
- Check OAuth credentials in environment variables
- Ensure OAuth apps are properly configured

**Email Not Sending**
- Verify Gmail app password is correct
- Check email environment variables
- Test with a simple email first

### Useful Commands

**Check Logs**
- Go to your web service in Render dashboard
- Click "Logs" tab
- Monitor real-time logs

**Redeploy**
- Go to your web service
- Click "Manual Deploy" → "Deploy latest commit"

**Restart Service**
- Go to your web service
- Click "Manual Deploy" → "Clear build cache & deploy"

## Security Checklist

- [ ] JWT_SECRET is a strong 32+ character string
- [ ] SESSION_SECRET is a strong 32+ character string
- [ ] NODE_ENV is set to production
- [ ] All OAuth callback URLs are correct
- [ ] Email credentials are secure
- [ ] Custom domain has SSL (automatic with Render)

## Performance Tips

1. **Free Tier Limitations**
   - App sleeps after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Consider paid plan for better performance

2. **Database Considerations**
   - SQLite file is ephemeral on free tier
   - Consider external database for production
   - Implement proper backup strategy

3. **Monitoring**
   - Use Render's built-in monitoring
   - Set up uptime monitoring
   - Monitor error rates and response times

## Success!

Your Pantry Organizer is now live at:
`https://your-app-name.onrender.com`

Share this URL with your users and start managing pantries! 🎉

## Support

If you encounter issues:
1. Check Render documentation
2. Review application logs
3. Verify environment variables
4. Test locally with production settings 