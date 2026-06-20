#!/bin/bash

# Exit on any error
set -e

echo "======================================"
echo " Starting NexaCRM Server Deployment "
echo "======================================"

# 1. Update system packages and install Docker if not installed (Ubuntu/Debian)
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Installing Docker..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# 2. Check for .env file
if [ ! -f .env.prod ]; then
    echo "Creating a default .env.prod file. PLEASE SECURE IT LATER!"
    cat <<EOF > .env.prod
DB_NAME=nexacrm
DB_USER=nexacrm
DB_PASSWORD=$(openssl rand -hex 16)
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=http://localhost
EOF
    echo "A new .env.prod file was generated."
fi

# Load variables to shell environment
export $(grep -v '^#' .env.prod | xargs)

# 3. Pull latest code (assuming this script is run from inside the git repo)
# Uncomment the below lines if you want this script to also pull from git.
# echo "Pulling latest code from git..."
# git pull origin main

# 4. Build and Start the Docker containers
echo "Building and starting Docker containers..."
sudo docker compose -f docker-compose.prod.yml up -d --build

echo "======================================"
echo " Deployment Successful! "
echo " NexaCRM should now be running on port 80."
echo "======================================"
