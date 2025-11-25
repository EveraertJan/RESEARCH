># Tastbaar Research - React Native App

Mobile application for the Tastbaar Research platform, built with React Native and Expo.

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 Secure authentication with encrypted storage
- 📊 Project management
- 💬 Real-time chat functionality
- 📸 Image upload and management
- 🎨 Clean, minimal UI matching web platform

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development tooling
- **React Navigation** - Navigation
- **Axios** - API communication
- **Expo SecureStore** - Encrypted credential storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device)
- Xcode (for iOS development - Mac only)
- Android Studio (for Android development)

## Quick Start

### Install Dependencies

```bash
cd images/app
npm install
```

### Start Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### Run on Device/Emulator

**iOS (Mac only):**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Using Expo Go App:**
1. Install Expo Go from App Store / Play Store
2. Scan QR code from terminal/browser
3. App loads on your device

## Project Structure

```
app/
├── App.js                 # Entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── babel.config.js       # Babel configuration
├── assets/               # Images, fonts, etc.
└── src/
    ├── screens/          # Screen components
    │   ├── LoginScreen.js
    │   ├── DashboardScreen.js
    │   └── ProjectDetailScreen.js
    ├── components/       # Reusable components
    ├── services/         # API services
    │   └── api.js
    ├── context/          # React context providers
    │   └── AuthContext.js
    └── utils/            # Utility functions
```

## Configuration

### API URL

Update in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.tastbaar.studio"
    }
  }
}
```

Or set environment variable:
```bash
export EXPO_PUBLIC_API_URL="https://api.tastbaar.studio"
```

## Development

### Hot Reload

- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Select "Enable Fast Refresh"
- Changes auto-reload on save

### Debug Menu

**iOS:** `Cmd+D`
**Android:** `Cmd+M`

Options:
- Reload
- Debug JS Remotely (Chrome DevTools)
- Show Performance Monitor
- Toggle Inspector

### Debugging

**React DevTools:**
```bash
npm install -g react-devtools
react-devtools
```

**Chrome DevTools:**
1. Open Debug menu
2. Select "Debug JS Remotely"
3. Opens Chrome with debugger

**VS Code Debugging:**
Install "React Native Tools" extension and add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug in Exponent",
      "type": "reactnative",
      "request": "launch",
      "platform": "exponent"
    }
  ]
}
```

## API Integration

### Authentication

Credentials are stored securely using Expo SecureStore (encrypted keychain on iOS, encrypted shared preferences on Android).

```javascript
import { useAuth } from './src/context/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();

  // Login
  await login('email@example.com', 'password');

  // Logout
  await logout();
}
```

### API Calls

```javascript
import { projectsAPI } from './src/services/api';

// Get all projects
const projects = await projectsAPI.getAll();

// Get specific project
const project = await projectsAPI.getById(projectId);

// Create project
const newProject = await projectsAPI.create({ name, client });
```

## Building for Production

### iOS

```bash
# Build for App Store
expo build:ios

# Or using EAS Build
eas build --platform ios
```

Requirements:
- Apple Developer account ($99/year)
- Xcode (Mac only)

### Android

```bash
# Build APK
expo build:android -t apk

# Build App Bundle (for Play Store)
expo build:android -t app-bundle

# Or using EAS Build
eas build --platform android
```

Requirements:
- Google Play Developer account ($25 one-time)

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform all
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
# Install Detox
npm install -g detox-cli

# Build test app
detox build

# Run tests
detox test
```

## Deployment

### Over-the-Air Updates (OTA)

```bash
# Publish update
expo publish

# Users get update automatically without app store
```

### App Stores

**iOS:**
1. Build app: `eas build --platform ios`
2. Upload to App Store Connect
3. Submit for review

**Android:**
1. Build app: `eas build --platform android`
2. Upload to Play Console
3. Submit for review

## Performance

### Optimization Tips

- Use `React.memo()` for expensive components
- Implement `FlatList` virtualization for lists
- Optimize images (use WebP, appropriate sizes)
- Use Hermes JS engine (enabled by default)
- Profile with React DevTools Profiler

### Bundle Size

```bash
# Analyze bundle
npx expo-cli customize:web
npm run build:web -- --analyze
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache
expo start -c

# Or
rm -rf node_modules
npm install
```

### iOS Simulator Not Starting
```bash
# List simulators
xcrun simctl list

# Erase simulator
xcrun simctl erase all
```

### Android Emulator Issues
```bash
# List AVDs
emulator -list-avds

# Cold boot
emulator -avd Pixel_3_API_30 -no-snapshot-load
```

### Dependency Conflicts
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## VS Code Extensions

Recommended extensions:
- React Native Tools
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Forums](https://forums.expo.dev/)

## Support

For issues:
1. Check logs: `expo start` terminal output
2. Check Expo DevTools
3. Search [Expo Forums](https://forums.expo.dev/)
4. Check GitHub issues

## License

Private - Tastbaar Studio
