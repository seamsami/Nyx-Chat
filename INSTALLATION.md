# 🚀 Nyx Chat Installation Guide

Welcome to Nyx Chat! This guide will help you set up the revolutionary chat application on your system.

## 📋 Prerequisites

Before installing Nyx Chat, ensure you have the following installed:

### Required Software
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (v5.0 or higher) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **Git** - [Download here](https://git-scm.com/)

### Optional Software
- **Redis** (for caching and sessions) - [Installation guide](https://redis.io/download)
- **Docker** (for containerized deployment) - [Download here](https://www.docker.com/)

## 🛠️ Quick Setup (Recommended)

The easiest way to set up Nyx Chat is using our automated setup script:

```bash
# Clone the repository
git clone https://github.com/your-username/nyx-chat.git
cd nyx-chat

# Make setup script executable (Unix/Linux/macOS)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The setup script will:
- ✅ Check system requirements
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Set up database connections
- ✅ Generate SSL certificates (optional)
- ✅ Configure Git hooks (optional)
- ✅ Build the application (optional)

## 📝 Manual Installation

If you prefer to set up manually or the automated script doesn't work:

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nyx-chat.git
cd nyx-chat
```

### 2. Install Dependencies

#### Server Dependencies
```bash
cd server
npm install
cd ..
```

#### Client Dependencies
```bash
cd client
npm install
cd ..
```

### 3. Environment Configuration

#### Server Environment
```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit the environment file with your settings
nano server/.env  # or use your preferred editor
```

#### Client Environment
```bash
# Create client environment file
cat > client/.env << EOF
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_APP_NAME=Nyx Chat
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF
```

### 4. Database Setup

#### MongoDB
```bash
# Start MongoDB service
# macOS (with Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

#### Redis (Optional)
```bash
# Start Redis service
# macOS (with Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server

# Windows (with Redis for Windows)
redis-server
```

### 5. Create Required Directories

```bash
# Create necessary directories
mkdir -p server/logs
mkdir -p server/uploads
mkdir -p client/public
```

## 🔧 Configuration

### Server Configuration (server/.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/nyx-chat

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Client URL
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# AI Features (Optional)
OPENAI_API_KEY=your-openai-api-key
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key
```

### Client Configuration (client/.env)

```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_APP_NAME=Nyx Chat
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
```

## 🚀 Running the Application

### Development Mode

#### Option 1: Using npm scripts (Recommended)
```bash
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
cd client
npm start
```

#### Option 2: Using concurrently (if installed)
```bash
# From the root directory
npm run dev  # This will start both server and client
```

### Production Mode

#### Build the application
```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
cd ..
```

#### Start production server
```bash
cd server
npm start
```

## 🐳 Docker Installation (Alternative)

If you prefer using Docker:

### Using Docker Compose
```bash
# Clone the repository
git clone https://github.com/your-username/nyx-chat.git
cd nyx-chat

# Start with Docker Compose
docker-compose up -d
```

### Manual Docker Setup
```bash
# Build and run MongoDB
docker run -d --name nyx-mongo -p 27017:27017 mongo:latest

# Build and run Redis (optional)
docker run -d --name nyx-redis -p 6379:6379 redis:latest

# Build server image
cd server
docker build -t nyx-chat-server .
docker run -d --name nyx-server -p 5000:5000 --link nyx-mongo:mongo nyx-chat-server

# Build client image
cd ../client
docker build -t nyx-chat-client .
docker run -d --name nyx-client -p 3000:3000 nyx-chat-client
```

## 🔍 Verification

After installation, verify everything is working:

### 1. Check Services
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Check if Redis is running (if using)
redis-cli ping

# Check if Node.js services are running
curl http://localhost:5000/health  # Server health check
curl http://localhost:3000         # Client application
```

### 2. Access the Application
- **Client Application**: http://localhost:3000
- **Server API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### 3. Test Features
1. Register a new account
2. Login with your credentials
3. Send a test message
4. Try voice/video calling features
5. Upload a file
6. Change theme settings

## 🛠️ Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000 or 5000
lsof -i :3000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

#### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

#### Permission Issues
```bash
# Fix npm permissions (Unix/Linux/macOS)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm to manage Node.js versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React build cache
rm -rf client/build
cd client && npm run build
```

### Environment-Specific Issues

#### Windows
- Use Git Bash or PowerShell for better compatibility
- Install Windows Build Tools: `npm install -g windows-build-tools`
- Use MongoDB Compass for database management

#### macOS
- Install Xcode Command Line Tools: `xcode-select --install`
- Use Homebrew for package management: `brew install mongodb-community redis`

#### Linux
- Install build essentials: `sudo apt-get install build-essential`
- Configure firewall if needed: `sudo ufw allow 3000` and `sudo ufw allow 5000`

## 📚 Additional Resources

### Documentation
- [API Documentation](./docs/API.md)
- [Component Documentation](./docs/COMPONENTS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### Support
- [GitHub Issues](https://github.com/your-username/nyx-chat/issues)
- [Discord Community](https://discord.gg/nyx-chat)
- [Documentation Website](https://nyx-chat.dev)

### Development Tools
- [VS Code Extensions](./docs/VSCODE_EXTENSIONS.md)
- [Debugging Guide](./docs/DEBUGGING.md)
- [Testing Guide](./docs/TESTING.md)

## 🎉 Next Steps

After successful installation:

1. **Customize Configuration**: Update environment variables for your needs
2. **Set Up External Services**: Configure email, file storage, and AI services
3. **Deploy to Production**: Follow our [deployment guide](./docs/DEPLOYMENT.md)
4. **Contribute**: Check out our [contributing guidelines](./CONTRIBUTING.md)

Welcome to the future of communication with Nyx Chat! 🚀