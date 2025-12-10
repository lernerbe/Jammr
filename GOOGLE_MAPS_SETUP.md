# Google Maps API Setup Guide

To enable real location search like professional apps, you need to set up a Google Maps API key.

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for location autocomplete)
   - **Geocoding API** (for coordinate conversion)
   - **Maps JavaScript API** (optional, for future map features)

## Step 2: Create API Key

1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

## Step 3: Configure API Key Restrictions (CRITICAL!)

1. Click on your API key to edit it
2. Under "Application restrictions", select **"None"** (for now)
   - This allows requests from any domain during development
   - We'll restrict it later for production
3. Under "API restrictions", select "Restrict key" and choose:
   - **Places API** (for location search)
   - **Geocoding API** (for coordinate conversion)
   - **Maps JavaScript API** (optional)

### ⚠️ IMPORTANT: For Development
- Set restrictions to "None" initially to avoid CORS issues
- This is what's preventing the API from working in your browser
- Major apps don't have this problem because they use server-side calls

## Step 4: Add to Your Project

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server: `npm run dev`

## Step 5: Test

1. Go to Profile → Edit Profile
2. Type in the location field (try "New York", "London", "Tokyo")
3. You should see real location suggestions from Google!

## Troubleshooting

- **No suggestions appearing**: Check browser console for API errors
- **"This API project is not authorized"**: Make sure you've enabled the required APIs
- **"RefererNotAllowedMapError"**: Check your API key restrictions
- **Still using fallback**: Verify your `.env` file has the correct variable name

## Cost

- Google Maps API has a free tier with generous limits
- For most apps, you'll stay within the free tier
- Monitor usage in Google Cloud Console

## Benefits

✅ **Real location search** - Find any city, town, or place worldwide  
✅ **Accurate results** - Same data used by Google Maps  
✅ **Fast autocomplete** - Optimized for typing experience  
✅ **Professional quality** - Same as major apps like Airbnb, Uber, etc.
