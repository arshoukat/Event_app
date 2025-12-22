# Logo Not Showing? Try These Steps

## Quick Fixes

### 1. Clear Metro Bundler Cache
```bash
# Stop your development server (Ctrl+C)
# Then run:
npx expo start --clear
```

### 2. Restart Development Server
If clearing cache doesn't work:
```bash
# Stop the server completely
# Then restart:
npm start
# or
npx expo start
```

### 3. Reload the App
- **iOS Simulator**: Press `Cmd + R` or shake device and select "Reload"
- **Android Emulator**: Press `R` twice or shake device and select "Reload"
- **Physical Device**: Shake device and select "Reload"

### 4. Verify Logo File
Make sure your logo file:
- ✅ Is named exactly `logo.png` (lowercase)
- ✅ Is located in `assets/logo.png`
- ✅ Is a valid PNG image file
- ✅ File size is reasonable (not too large)

### 5. Check Console for Errors
Look for any error messages in:
- Metro bundler terminal
- Browser console (if using web)
- React Native debugger

## If Still Not Working

1. **Verify the file path**: The logo should be at `assets/logo.png` relative to the project root
2. **Check file permissions**: Make sure the file is readable
3. **Try a different image**: Test with a simple PNG to rule out image format issues
4. **Check Metro bundler output**: Look for any warnings about the logo.png file

## File Location
```
Event_app/
  └── assets/
      └── logo.png  ← Your logo should be here
```

## Component Location
The Logo component is at: `components/Logo.tsx`

If you see the placeholder (black square with white circle), it means:
- The logo.png file might not be found
- The image failed to load
- Metro bundler needs to be restarted

