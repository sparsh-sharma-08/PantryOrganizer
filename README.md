# Pantry Organizer

A modern web application to help you manage your pantry, shopping list, and food inventory. Built with Node.js, Express, SQLite, and JWT authentication.

## Features
- User authentication (JWT, OAuth)
- Pantry item management
- Shopping list
- Expiry reminders
- User settings
- Contact form
- Secure, rate-limited API

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/PantryOrganizer.git
   cd PantryOrganizer
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3000
   JWT_SECRET=your-very-strong-secret
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   SUPPORT_EMAIL=support@yourdomain.com
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SESSION_SECRET=your-session-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

### Running Locally
```sh
node server.js
```
Visit [http://localhost:3000](http://localhost:3000)

### Deployment (Render)
1. Push your code to GitHub.
2. Create a new Web Service on [Render](https://render.com/).
3. Set environment variables as above in the Render dashboard.
4. Use `npm install` as the build command and `node server.js` as the start command.

## Environment Variables
| Variable        | Description                       |
|-----------------|-----------------------------------|
| PORT            | Port to run the server            |
| JWT_SECRET      | Secret for JWT signing            |
| EMAIL_SERVICE   | Email provider (e.g., gmail)      |
| EMAIL_USER      | Email address for sending mails   |
| EMAIL_PASS      | App password for email            |
| SUPPORT_EMAIL   | Support contact email             |
| FRONTEND_URL    | Allowed frontend domain for CORS  |
| NODE_ENV        | Set to 'production' in prod       |
| GOOGLE_CLIENT_ID | Google OAuth Client ID            |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret    |
| GITHUB_CLIENT_ID | GitHub OAuth Client ID            |
| GITHUB_CLIENT_SECRET | GitHub OAuth Client Secret    |
| SESSION_SECRET  | Secret for session management     |

## License
MIT

## Contact
For support, use the contact form in the app or email: sparshsharma0825@gmail.com

---
**Address:**
Kharar, Chandigarh, India 
