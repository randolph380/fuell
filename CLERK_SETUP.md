# Clerk Authentication Setup

## 🔐 Get Your Clerk API Keys

### Step 1: Create Clerk Account
1. Go to https://clerk.com
2. Sign up for a free account
3. Click "Create Application"
4. Give it a name (e.g., "MacroTracker")

### Step 2: Configure Authentication Methods
In your Clerk Dashboard:
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Enable **Email address** (required)
3. Go to **User & Authentication** → **Social Connections**
4. Enable **Google** (click Configure and follow instructions)
5. Enable **Apple** for iOS (click Configure and follow instructions)

### Step 3: Get Your Publishable Key
1. In Clerk Dashboard, go to **API Keys**
2. Copy your **Publishable key** (starts with `pk_test_...`)

### Step 4: Add Key to Your App

**Option 1: Using Terminal (Recommended)**
```bash
cd /Users/Randolph/MacroTracker
echo 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here' > .env
```

**Option 2: Manual**
1. Create a file named `.env` in your project root
2. Add this line:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
```

### Step 5: Verify .gitignore
Make sure `.env` is in your `.gitignore` file so you don't commit your keys.

Already added! ✅

---

## 🚀 Testing Authentication

### Test Email/Password
1. Run your app: `npm start`
2. Click "Sign Up" on the login screen
3. Enter email and password
4. Check your email for verification code
5. Enter code to verify

### Test Google OAuth
1. Make sure Google is enabled in Clerk Dashboard
2. Click "Continue with Google"
3. Sign in with your Google account

### Test Apple OAuth (iOS only)
1. Make sure Apple is enabled in Clerk Dashboard
2. Add your Apple Developer Team ID in Clerk
3. Click "Continue with Apple"
4. Sign in with your Apple ID

---

## 📱 What's Implemented

✅ **Email/Password Authentication**
- Sign up with email
- Sign in with email
- Email verification
- Secure password storage

✅ **Google OAuth**
- One-click Google sign-in
- Automatic account creation

✅ **Apple OAuth (iOS)**
- Native Apple sign-in
- Privacy-focused

✅ **Secure Token Storage**
- Tokens stored in device secure storage
- Automatic session management

✅ **User Context**
- User info available throughout app
- Ready for user-specific meal storage

---

## 🔧 Advanced Configuration

### Custom Redirect URLs
If you need custom redirect URLs for OAuth:

1. In Clerk Dashboard → **API Keys**
2. Add your redirect URLs under **Authorized redirect URIs**:
   - For development: `exp://localhost:8081`
   - For production: Your actual app scheme

### Production Keys
When deploying to production:

1. Create a **Production** instance in Clerk
2. Get production `pk_live_...` key
3. Update your environment variables
4. Use **Environment Variables** in Expo/EAS Build

---

## 📝 Next Steps

1. **Add Sign Out Button** - Add a sign-out option in your settings
2. **User Profile** - Show user's email/name in the app
3. **User-Specific Storage** - Update storage to be per-user
4. **Cloud Sync** - Optional: Sync meals across devices

Need help? Check out: https://clerk.com/docs/quickstarts/expo


