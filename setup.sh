#!/bin/bash

# Nyx Chat - Setup Script
# This script sets up the complete Nyx Chat application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="18.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is not compatible. Required: $REQUIRED_VERSION or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "🔧 Installing Dependencies"
    
    # Check for Node.js
    if ! check_node_version; then
        print_error "Please install Node.js 18 or higher from https://nodejs.org/"
        exit 1
    fi
    
    # Check for npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js which includes npm."
        exit 1
    fi
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    print_success "Client dependencies installed"
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    print_success "Server dependencies installed"
}

# Function to setup environment files
setup_environment() {
    print_header "⚙️  Setting up Environment"
    
    # Setup server environment
    if [ ! -f "server/.env" ]; then
        print_status "Creating server environment file..."
        cp server/.env.example server/.env
        print_warning "Please edit server/.env with your configuration"
    else
        print_warning "Server .env file already exists"
    fi
    
    # Setup client environment (if needed)
    if [ ! -f "client/.env" ]; then
        print_status "Creating client environment file..."
        cat > client/.env << EOF
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_APP_NAME=Nyx Chat
REACT_APP_VERSION=1.0.0
GENERATE_SOURCEMAP=false
EOF
        print_success "Client environment file created"
    else
        print_warning "Client .env file already exists"
    fi
}

# Function to setup database
setup_database() {
    print_header "🗄️  Database Setup"
    
    # Check if MongoDB is running
    if command_exists mongosh; then
        print_status "MongoDB CLI found, checking connection..."
        if mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is running and accessible"
        else
            print_warning "MongoDB is not running. Please start MongoDB service."
            print_status "On macOS: brew services start mongodb-community"
            print_status "On Ubuntu: sudo systemctl start mongod"
            print_status "On Windows: net start MongoDB"
        fi
    elif command_exists mongo; then
        print_status "Legacy MongoDB CLI found, checking connection..."
        if mongo --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            print_success "MongoDB is running and accessible"
        else
            print_warning "MongoDB is not running. Please start MongoDB service."
        fi
    else
        print_warning "MongoDB CLI not found. Please install MongoDB:"
        print_status "Visit: https://docs.mongodb.com/manual/installation/"
    fi
}

# Function to build the application
build_application() {
    print_header "🏗️  Building Application"
    
    # Build server
    print_status "Building server..."
    cd server
    npm run build
    cd ..
    print_success "Server built successfully"
    
    # Build client
    print_status "Building client..."
    cd client
    npm run build
    cd ..
    print_success "Client built successfully"
}

# Function to create necessary directories
create_directories() {
    print_header "📁 Creating Directories"
    
    # Create logs directory for server
    mkdir -p server/logs
    print_success "Server logs directory created"
    
    # Create uploads directory for file storage
    mkdir -p server/uploads
    print_success "Server uploads directory created"
    
    # Create public directory for client assets
    mkdir -p client/public
    print_success "Client public directory created"
}

# Function to generate SSL certificates for development
generate_ssl_certs() {
    print_header "🔒 SSL Certificate Setup (Optional)"
    
    read -p "Do you want to generate SSL certificates for HTTPS development? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists openssl; then
            print_status "Generating SSL certificates..."
            mkdir -p certs
            
            # Generate private key
            openssl genrsa -out certs/private-key.pem 2048
            
            # Generate certificate
            openssl req -new -x509 -key certs/private-key.pem -out certs/certificate.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            
            print_success "SSL certificates generated in ./certs/"
            print_warning "These are self-signed certificates for development only"
        else
            print_error "OpenSSL not found. Please install OpenSSL to generate certificates."
        fi
    fi
}

# Function to setup Git hooks (optional)
setup_git_hooks() {
    print_header "🔗 Git Hooks Setup (Optional)"
    
    if [ -d ".git" ]; then
        read -p "Do you want to setup Git hooks for code quality? (y/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Setting up Git hooks..."
            
            # Create pre-commit hook
            cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Nyx Chat pre-commit hook

echo "Running pre-commit checks..."

# Check client code
cd client
npm run lint
if [ $? -ne 0 ]; then
    echo "Client linting failed. Please fix the issues before committing."
    exit 1
fi

# Check server code
cd ../server
npm run lint
if [ $? -ne 0 ]; then
    echo "Server linting failed. Please fix the issues before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
            
            chmod +x .git/hooks/pre-commit
            print_success "Git pre-commit hook installed"
        fi
    else
        print_warning "Not a Git repository. Skipping Git hooks setup."
    fi
}

# Function to display final instructions
display_instructions() {
    print_header "🎉 Setup Complete!"
    
    echo
    print_success "Nyx Chat has been set up successfully!"
    echo
    print_status "Next steps:"
    echo "1. Configure your environment variables in server/.env"
    echo "2. Start MongoDB if not already running"
    echo "3. Start the development servers:"
    echo
    echo -e "${CYAN}   # Terminal 1 - Start the server${NC}"
    echo -e "${CYAN}   cd server && npm run dev${NC}"
    echo
    echo -e "${CYAN}   # Terminal 2 - Start the client${NC}"
    echo -e "${CYAN}   cd client && npm start${NC}"
    echo
    print_status "The application will be available at:"
    echo "   • Client: http://localhost:3000"
    echo "   • Server: http://localhost:5000"
    echo
    print_status "For production deployment:"
    echo "   • Build: npm run build (in both client and server directories)"
    echo "   • Start: npm start (in server directory)"
    echo
    print_warning "Don't forget to:"
    echo "   • Configure your database connection"
    echo "   • Set up your JWT secret"
    echo "   • Configure email settings (optional)"
    echo "   • Set up file storage (AWS S3 or Cloudinary)"
    echo
    print_success "Happy coding! 🚀"
}

# Main setup function
main() {
    clear
    
    # Display banner
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║                    🌟 NYX CHAT SETUP 🌟                      ║"
    echo "║                                                               ║"
    echo "║              The Future of Communication                      ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    
    print_status "Starting Nyx Chat setup process..."
    echo
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
        print_error "Please run this script from the nyx-chat root directory"
        exit 1
    fi
    
    # Run setup steps
    create_directories
    install_dependencies
    setup_environment
    setup_database
    generate_ssl_certs
    setup_git_hooks
    
    # Ask if user wants to build for production
    echo
    read -p "Do you want to build the application for production? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_application
    fi
    
    display_instructions
}

# Run main function
main "$@"