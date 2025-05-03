# SecureChatConnectApp
## Sample Outputs
![WhatsApp Image 2025-05-03 at 10 25 43_066ca883](https://github.com/user-attachments/assets/9c94daa4-4226-4c3c-a34c-46c5d2fe8752)

![WhatsApp Image 2025-05-03 at 10 25 42_e41656db](https://github.com/user-attachments/assets/b05bfc84-a7c1-4a12-b1f0-4dde6e62d754)

![WhatsApp Image 2025-05-03 at 10 25 42_51b969f2](https://github.com/user-attachments/assets/7230b43c-8eb6-4530-a814-99648d3bb3fc)

![WhatsApp Image 2025-05-03 at 10 25 41_1c8e0718](https://github.com/user-attachments/assets/e564023f-107d-4d09-9b0d-a5b3a7bbe152)

![WhatsApp Image 2025-05-03 at 10 25 41_4007e3bd](https://github.com/user-attachments/assets/524a7b50-68b4-4c30-9b2a-efce9270300d)

![WhatsApp Image 2025-05-03 at 10 25 40_4ed4b1c8](https://github.com/user-attachments/assets/23489a7f-38a1-4988-9d3d-eb4b49659708)

![WhatsApp Image 2025-05-03 at 10 25 40_bbc1a157](https://github.com/user-attachments/assets/40620e6d-a3f5-46c5-a508-1d7e122c6220)


## Table of Contents
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [IP Address Configuration](#ip-address-configuration)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Building APK](#building-apk)
- [API Documentation](#api-documentation)
- [Architecture Overview](#architecture-overview)
- [Security Implementation](#security-implementation)
- [Challenges & Solutions](#challenges--solutions)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- Git

### IP Address Configuration
You need to update the IP address in several files to match your local development machine:

1. Frontend Configuration (`SecureChatConnectApp/src/config/api.ts`):
```typescript
export const API_URL = 'http://YOUR_LOCAL_IP:3000';
```

2. Backend Configuration (`backend/config/default.json`):
```json
{
  "serverUrl": "http://YOUR_LOCAL_IP:3000"
}
```

To find your local IP address:
- Windows: Open CMD and type `ipconfig`
- Mac/Linux: Open Terminal and type `ifconfig`
- Use the IPv4 address (usually starts with 192.168 or 10.0)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/srujan5570/SecureChatConnectApp.git
cd SecureChatConnect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update the .env file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/securechat
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

5. Start the backend server:
```bash
npm run dev  # for development
npm start    # for production
```

### Frontend Setup

1. Navigate to the app directory:
```bash
cd SecureChatConnectApp
```

2. Install dependencies:
```bash
npm install
```

3. Install pods (iOS only):
```bash
cd ios && pod install && cd ..
```

4. Start Metro bundler:
```bash
npm start
```

5. Run the app:
```bash
# For Android
npm run android

# For iOS
npm run ios
```

### Building APK

1. Generate a keystore (if not already done):
```bash
keytool -genkey -v -keystore android/app/release.keystore -alias secure-chat -keyalg RSA -keysize 2048 -validity 10000
```

2. Update `android/gradle.properties` with your keystore details:
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=secure-chat
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

3. Build the APK:
```bash
cd android
./gradlew assembleRelease
```

The APK will be available at: `android/app/build/outputs/apk/release/app-release.apk`

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response (200 OK):
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200 OK):
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  }
}
```

### Chat Endpoints

#### Get Messages
```http
GET /api/messages/chat?userId=123&receiverId=456
Authorization: Bearer jwt_token_here

Response (200 OK):
{
  "messages": [
    {
      "_id": "msg_id",
      "content": "Hello!",
      "sender": {
        "_id": "user_id",
        "username": "John"
      },
      "timestamp": "2024-03-10T12:00:00Z",
      "status": "delivered"
    }
  ]
}
```

#### Send Message
```http
POST /api/messages
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "receiverId": "user_id",
  "content": "Hello!",
  "messageType": "text"
}

Response (201 Created):
{
  "message": {
    "_id": "msg_id",
    "content": "Hello!",
    "timestamp": "2024-03-10T12:00:00Z",
    "status": "sent"
  }
}
```

### WebSocket Events

#### Connection
```javascript
// Client-side connection
socket.connect({
  query: {
    token: 'jwt_token_here'
  }
});

// Server acknowledgment
socket.on('connect', () => {
  console.log('Connected with ID:', socket.id);
});
```

#### Message Events
```javascript
// Send message
socket.emit('message', {
  receiverId: 'user_id',
  content: 'Hello!',
  messageId: 'unique_id'
});

// Receive message
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Message status
socket.on('messageStatus', {
  messageId: 'msg_id',
  status: 'delivered'
});
```

#### Typing Status
```javascript
// Send typing status
socket.emit('typing', {
  receiverId: 'user_id',
  isTyping: true
});

// Receive typing status
socket.on('userTyping', (data) => {
  console.log('User typing:', data.userId);
});
```

### Error Handling

All endpoints return standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error Response Format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Rate Limiting

- API calls: 100 requests per minute per IP
- Login attempts: 5 attempts per 15 minutes
- Message sending: 60 messages per minute

### Security Notes

1. Authentication:
   - JWT tokens expire after 24 hours
   - Refresh tokens available for seamless experience
   - Tokens stored securely using AsyncStorage
   - Biometric authentication available

2. Data Protection:
   - End-to-end encryption for messages
   - Password hashing using bcrypt (10 rounds)
   - HTTPS/WSS for all communications
   - Certificate pinning for API calls

3. Input Validation:
   - Message size limit: 10KB
   - File upload limit: 10MB
   - Supported file types: images, documents
   - Input sanitization for XSS prevention

## Architecture Overview

### Frontend Architecture
```
SecureChatConnectApp/
├── src/
│   ├── components/    # Reusable UI components
│   ├── screens/       # Screen components
│   ├── navigation/    # Navigation configuration
│   ├── context/      # React Context providers
│   ├── services/     # API and socket services
│   ├── utils/        # Helper functions
│   └── config/       # App configuration
```

### Backend Architecture
```
backend/
├── controllers/   # Request handlers
├── models/       # Database models
├── routes/       # API routes
├── middleware/   # Custom middleware
├── config/       # Configuration files
└── services/     # Business logic
```

## Security Implementation

1. Data Protection
   - End-to-end encryption for messages
   - Secure storage of user credentials
   - JWT for authentication
   - Password hashing using bcrypt

2. Communication Security
   - HTTPS for API calls
   - WebSocket secure connection
   - Input validation and sanitization
   - Rate limiting for API endpoints

3. Mobile Security
   - Secure storage for tokens
   - Biometric authentication option
   - Session management
   - Certificate pinning

## Challenges & Solutions

1. Real-time Message Delivery
   - Challenge: Message ordering and delivery confirmation
   - Solution: Implemented message queue system with acknowledgments

2. Video Call Integration
   - Challenge: NAT traversal and peer connectivity
   - Solution: Used STUN/TURN servers for reliable connections

3. Offline Support
   - Challenge: Message persistence during poor connectivity
   - Solution: Local storage with sync mechanism

4. Performance
   - Challenge: Large message history loading
   - Solution: Implemented pagination and lazy loading

5. Security
   - Challenge: Securing user data and communications
   - Solution: Implemented end-to-end encryption and secure protocols 






