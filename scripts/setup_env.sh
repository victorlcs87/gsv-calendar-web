#!/bin/bash
set -e

echo "🔍 Checking for NVM..."
if [ -d "$HOME/.nvm" ]; then
    echo "✅ NVM found."
else
    echo "⬇️ Installing NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "📦 Installing Node.js v20 (LTS)..."
nvm install 20
nvm use 20
nvm alias default 20

echo "✅ Node Version: $(node -v)"
echo "✅ NPM Version: $(npm -v)"

echo "📥 Installing project dependencies..."
npm install

echo "🎉 Setup complete! You may need to restart your terminal or run 'source ~/.bashrc' to use node globally."
