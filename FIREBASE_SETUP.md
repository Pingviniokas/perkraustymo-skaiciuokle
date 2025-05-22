# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `perkraustymo-skaiciuokle`
4. Enable Google Analytics (optional)
5. Create project

## 2. Set up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select location (europe-west3 for Lithuania)

## 3. Get Firebase Config

1. In Project Overview, click the Web icon (`</>`)
2. Register your app with nickname: `perkraustymo-app`
3. Copy the firebaseConfig object

## 4. Update Firebase Configuration

Replace the config in `utils/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 5. Firestore Security Rules (for development)

In Firestore → Rules, use these rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // WARNING: Only for development!
    }
  }
}
```

## 6. Production Security Rules

For production, use proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. Test the Connection

1. Run `npm run dev`
2. Open browser console
3. Check for any Firebase connection errors
4. Try adding an order to test Firebase integration

## 8. Optional: Set up Firebase Authentication

For user authentication (recommended for production):

1. In Firebase Console → Authentication
2. Set up Sign-in method (Email/Password)
3. Add authentication to your app

## Benefits of Firebase vs localStorage

✅ **Data persistence** across devices and browsers  
✅ **Real-time synchronization** between multiple users  
✅ **Automatic backups** and data recovery  
✅ **Scalability** for growing business  
✅ **Security** with proper rules  
✅ **Offline support** with Firebase SDK  

## Troubleshooting

**Connection Issues:**
- Check Firebase config values
- Verify project ID matches
- Check browser console for errors

**Permission Denied:**
- Update Firestore rules
- Check authentication setup

**Data Not Syncing:**
- Verify internet connection
- Check Firebase console for data
- Review browser network tab 