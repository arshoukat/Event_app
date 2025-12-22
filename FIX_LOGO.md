# Fix Logo Loading Issue

## Step 1: Clear Metro Bundler Cache
```bash
# Stop your dev server (Ctrl+C), then:
npx expo start --clear
```

## Step 2: If that doesn't work, try:
```bash
# Clear all caches
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

## Step 3: Verify the logo file
The logo should be at: `assets/logo.png`
Current status: ✅ File exists (576x565 PNG)

## Step 4: Check Metro bundler output
When you start the server, look for any errors about logo.png in the terminal.

## Alternative: Use URI instead of require
If require() doesn't work, we can switch to using a URI-based approach.
