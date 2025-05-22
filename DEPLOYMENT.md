# Deployment Instructions

## Setting up Environment Variables in Vercel

After deploying your project to Vercel, you need to configure the Firebase environment variables:

### 1. Go to Vercel Dashboard
- Open your project in the Vercel dashboard
- Navigate to the "Settings" tab
- Click on "Environment Variables" in the sidebar

### 2. Add the following environment variables:

| Variable Name | Value | Environment |
|---------------|--------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.firebasestorage.app | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | Your app ID | Production, Preview, Development |
| `VITE_FIREBASE_MEASUREMENT_ID` | Your measurement ID | Production, Preview, Development |

### 3. Get Firebase Configuration Values

1. Go to your Firebase Console
2. Select your project
3. Click on the gear icon (Settings) → Project settings
4. Scroll down to "Your apps" section
5. Click on your web app or create one if it doesn't exist
6. Copy the config values from the `firebaseConfig` object

### 4. Local Development

For local development, create a `.env.local` file in your project root:

```bash
# Firebase Configuration for Local Development
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

⚠️ **Important**: Never commit `.env.local` or any file containing actual API keys to version control.

### 5. Redeploy

After adding the environment variables:
1. Trigger a new deployment in Vercel (or push a new commit)
2. The app will now use the secure environment variables instead of hardcoded values

## Security Benefits

- API keys are no longer exposed in the client bundle
- Environment variables are securely managed by Vercel
- Different environments can use different Firebase projects if needed
- Easier to rotate keys without code changes 