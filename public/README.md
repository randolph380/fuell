# Static Files Directory

This directory contains static HTML files that can be served by your Expo web app.

## Privacy Policy

The `privacy-policy.html` file is ready for your Termly privacy policy HTML code.

### How to add your Termly privacy policy:

1. **Copy your HTML code from Termly**
   - Log into your Termly account
   - Navigate to your privacy policy
   - Copy the generated HTML code

2. **Replace the placeholder content**
   - Open `privacy-policy.html`
   - Find the comment: `<!-- PASTE YOUR TERMLY PRIVACY POLICY HTML CODE HERE -->`
   - Replace the entire comment block with your HTML code

3. **Update the date**
   - Change `[DATE]` in the "Last updated" section to your actual date

4. **Update contact information**
   - Replace `[YOUR_EMAIL]` and `[YOUR_WEBSITE]` with your actual contact details

### Accessing the privacy policy:

- **Web**: Visit `/privacy-policy.html` directly
- **Mobile**: Use the "Privacy Policy" link in the app (navigates to `/privacy-policy` route)
- **Direct URL**: `https://yourdomain.com/privacy-policy.html`

### Testing:

1. Run `npm run web` to start the development server
2. Navigate to `http://localhost:8081/privacy-policy.html`
3. Test the mobile app navigation by tapping the "Privacy Policy" link

### File Structure:

```
public/
├── privacy-policy.html    # Your privacy policy HTML file
└── README.md             # This documentation
```

The privacy policy is automatically accessible through:
- Direct HTML file: `/privacy-policy.html`
- React Native route: `/privacy-policy` (uses WebView on mobile)
- App navigation: Link in the home screen

