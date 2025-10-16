# Jammr - Connect Musicians Worldwide 🎸

A mobile-first networking platform for musicians to connect, collaborate, and form bands. Built with React, TypeScript, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/lernerbe/Jammr.git
cd Jammr

# Install dependencies
npm install
```

### 2. Firebase Configuration
**Use the shared Firebase project** (recommended for team development):

1. **Get Firebase config from team lead**:
   - Ask for the Firebase configuration values
   - Create your `.env` file with the provided config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. **Benefits of shared Firebase**:
   - ✅ Same database - see each other's test data
   - ✅ Shared authentication - can test with same users
   - ✅ No setup required - just copy config
   - ✅ Real-time collaboration

### 3. Run the Application
```bash
# Start development server
npm run dev

# Open http://localhost:8080 in your browser
```

### 4. Test the Application
1. **Basic UI**: Navigate through all pages (should work without Firebase)
2. **Authentication**: Create account, sign in, test Google OAuth
3. **Profile Management**: Edit and save profile data
4. **Check Firestore**: Verify data appears in Firebase Console

### 5. Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🏗️ Project Structure
```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── contexts/       # React contexts (Auth, etc.)
├── services/       # Firebase services
├── types/          # TypeScript type definitions
├── lib/            # Utility functions
└── hooks/          # Custom React hooks
```

## 🎯 Current Features
- ✅ User Authentication (Email/Password + Google OAuth)
- ✅ Profile Management with Firestore
- ✅ Responsive Mobile-First Design
- ✅ Protected Routes
- ✅ Real-time Data Persistence

## 🚧 Next Features
- 🔄 Discovery with Real User Data
- 🔄 Match Request System
- 🔄 Real-time Chat
- 🔄 Location Services
- 🔄 Audio File Uploads

---

## Lovable Project Info

**URL**: https://lovable.dev/projects/b905020c-ec93-4186-8114-59e8d01ae142

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b905020c-ec93-4186-8114-59e8d01ae142) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b905020c-ec93-4186-8114-59e8d01ae142) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
