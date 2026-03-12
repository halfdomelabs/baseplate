#!/bin/sh

set -e

# Fix permissions on claude config directory
sudo chown vscode:vscode /home/vscode/.claude

# Fix permissions on node_modules directory
sudo chown vscode:vscode node_modules
# Fix permissions on commandhistory directory
sudo chown vscode:vscode /commandhistory

# Restrict access to root-only secrets folder
sudo chmod 700 /run/secrets

# Set up firewall and Squid proxy
sudo /usr/local/bin/init-firewall.sh

# Configure git to use forward proxy for GitHub (ssl_bump + token injection)
git config --global http.https://github.com.proxy http://127.0.0.1:3128
git config --global http.https://api.github.com.proxy http://127.0.0.1:3128

# Provide dummy credentials so git doesn't prompt — Squid replaces with real token
git config --global credential.https://github.com.helper '!f() { echo "username=x-access-token"; echo "password=proxy-injected"; }; f'
git config --global credential.https://api.github.com.helper '!f() { echo "username=x-access-token"; echo "password=proxy-injected"; }; f'

# Configure gh CLI auth (dummy token — Squid injects the real one via ssl_bump)
mkdir -p ~/.config/gh
cat > ~/.config/gh/hosts.yml <<'GHEOF'
github.com:
    user: x-access-token
    oauth_token: proxy-injected
    git_protocol: https
GHEOF

# gh CLI proxy wrapper — sets HTTPS_PROXY for gh only
# Uses a wrapper script instead of an alias so it works for non-interactive
# invocations (e.g. Claude agent, scripts, cron) not just interactive shells.
mkdir -p ~/.local/bin
cat > ~/.local/bin/gh <<'GHWRAPPER'
#!/bin/sh
exec env HTTPS_PROXY=http://127.0.0.1:3128 /usr/bin/gh "$@"
GHWRAPPER
chmod +x ~/.local/bin/gh

# Remove general sudo access (restricted firewall-only sudo remains via /etc/sudoers.d/user-firewall)
sudo rm /etc/sudoers.d/vscode

# Set up pnpm store
pnpm config set store-dir "$PWD/node_modules/.pnpm-store"

# Trust mise and install dependencies
mise trust
pnpm install
