#!/usr/bin/env bash

set -euo pipefail

BOLD='\033[0;1m'

printf "${BOLD}Installing webgit\n\n"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if webgit is already installed globally
if ! command -v webgit &> /dev/null; then
    printf "Installing @rodriguezst_/webgit globally...\n\n"
    npm install -g @rodriguezst_/webgit 2>&1 | tee -a ${LOG_PATH}
fi

printf "🥳 Installation complete!\n\n"

printf "🛠️ Configuring webgit\n\n"

# Resolve the repository directory
ROOT_DIR=${FOLDER}
ROOT_DIR=${ROOT_DIR/\~/$HOME}

echo "Repository directory: ${ROOT_DIR}"
echo "Port: ${PORT}"
echo "Base path: ${SERVER_BASE_PATH}"

# Check if the directory exists
if [[ ! -d "${ROOT_DIR}" ]]; then
    echo "Error: Directory does not exist: ${ROOT_DIR}"
    exit 1
fi

# Check if it's a git repository
if [[ ! -d "${ROOT_DIR}/.git" ]]; then
    echo "Warning: Not a git repository: ${ROOT_DIR}"
    echo "Initializing git repository..."
    cd "${ROOT_DIR}"
    git init 2>&1 | tee -a ${LOG_PATH}
fi

printf "👷 Starting webgit in background...\n\n"

printf "📂 Serving git repository at ${ROOT_DIR}\n\n"

# Start webgit with the specified port and directory
cd "${ROOT_DIR}"
webgit --port ${PORT} --dir "${ROOT_DIR}" >> ${LOG_PATH} 2>&1 &

printf "📝 Logs at ${LOG_PATH}\n\n"
