#!/bin/sh

cat > /usr/local/bin/fix-chown \
<< EOF
#!/bin/sh
chown -R vscode:vscode /home/vscode/.local/share/pnpm
EOF
