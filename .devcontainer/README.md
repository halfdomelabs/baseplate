# Baseplate Development Container

This development container provides a consistent, secure development environment for working with the Baseplate project. It includes all necessary tools, configurations, and security restrictions to ensure a standardized development experience.

## Features

- **Ubuntu Noble (24.04)** base image with essential development tools
- **Mise** for managing tool versions (Node.js, pnpm, etc.)
- **ZSH** with Starship prompt for an enhanced terminal experience
- **Network isolation** with firewall rules restricting outbound connections
- **VS Code integration** with recommended extensions and settings
- **Persistent volumes** for pnpm cache, node_modules, and command history
- **Claude Code CLI** pre-installed for AI-assisted development

## Security

The container implements strict network security through iptables firewall rules:

### Allowed Connections

- GitHub API and repositories (for git operations)
- NPM registry (for package installation)
- Anthropic API (for Claude Code)
- VS Code marketplace and update servers
- Local network and DNS resolution

### Blocked Connections

- All other outbound internet traffic is blocked by default
- This prevents accidental data exfiltration and ensures controlled dependencies

## Quick Start

### Using VS Code Dev Containers

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project in VS Code
3. Click "Reopen in Container" when prompted (or use Command Palette: `Dev Containers: Reopen in Container`)
4. Wait for the container to build and initialize

### Manual Docker Testing

To test the Dockerfile in an isolated environment:

```bash
docker build -t dev -f .devcontainer/Dockerfile . && \
docker run --user vscode -it --rm --cap-add=NET_ADMIN --cap-add=NET_RAW dev /bin/zsh
```

**Note:** The `--cap-add` flags are required for the firewall initialization to work properly.

## Container Structure

### Files

- `devcontainer.json` - Main configuration file for VS Code integration
- `Dockerfile` - Container build instructions
- `post-create.sh` - Script that runs after container creation (installs dependencies)
- `init-firewall.sh` - Network security configuration script
- `.zshrc` - ZSH shell configuration
- `starship.toml` - Starship prompt configuration

### Volumes

The container uses named volumes for persistence:

- `pnpm` - pnpm global store cache
- `bashhistory` - Command history persistence
- `claude` - Claude Code configuration

### Environment Variables

- `NODE_OPTIONS="--max-old-space-size=4096"` - Increased Node.js memory limit
- `CLAUDE_CONFIG_DIR="/home/vscode/.claude"` - Claude Code configuration location
- `TZ` - Timezone (defaults to America/Los_Angeles, configurable via local environment)
- `BASEPLATE_DEV_EXTENSION_PATH` - Optional path to the local Baseplate VS Code extension for development (mounted at `/baseplate-extension` in the container)
- `BASEPLATE_DEV_DOCS_PATH` - Optional path to the local Baseplate documentation repository for development (mounted at `/baseplate-docs` in the container)

## Development Workflow

1. **First Run**: The container will automatically:
   - Set up the firewall rules
   - Install mise-managed tools
   - Run `pnpm install` to install project dependencies
   - Configure the development environment

2. **Daily Development**:
   - The container preserves your work between sessions
   - Command history is maintained
   - pnpm cache is reused for faster installs

3. **Running Commands**:

   ```bash
   # Build the project
   pnpm build

   # Run tests
   pnpm test:affected

   # Lint and fix issues
   pnpm lint:only:affected -- --fix

   # Type checking
   pnpm typecheck
   ```

## Troubleshooting

### Firewall Issues

If you encounter network connectivity problems:

1. Check allowed domains in `init-firewall.sh`
2. Verify firewall rules: `sudo iptables -L -v -n`
3. Check ipset entries: `sudo ipset list allowed-domains`

### Permission Issues

The post-create script handles most permission issues automatically. If problems persist:

```bash
sudo chown -R vscode:vscode /home/vscode/.local/share/pnpm
```

### Rebuilding the Container

To force a complete rebuild:

1. In VS Code: `Dev Containers: Rebuild Container`
2. Or manually: Delete the container and volumes, then restart

## Customization

### Local Extension Development

To develop the Baseplate VS Code extension alongside the main project:

1. Set the `BASEPLATE_DEV_EXTENSION_PATH` environment variable in your `.env` file at the repository root:

   ```bash
   BASEPLATE_DEV_EXTENSION_PATH=/path/to/your/local/baseplate-extension
   ```

2. The extension directory will be mounted at `/baseplate-extension` in the container
3. The dev container will automatically detect and use the local extension if present

### Local Documentation Development

To work with the Baseplate documentation repository alongside the main project:

1. Set the `BASEPLATE_DEV_DOCS_PATH` environment variable in your `.env` file at the repository root:

   ```bash
   BASEPLATE_DEV_DOCS_PATH=/path/to/your/local/baseplate-docs
   ```

2. The documentation directory will be mounted at `/baseplate-docs` in the container
3. You can directly edit and access documentation files during development
4. This provides better performance than using the MCP server for documentation access

### Adding New Allowed Domains

Edit `init-firewall.sh` and add domains to the allowed list:

```bash
for domain in \
    "registry.npmjs.org" \
    "your-new-domain.com" \  # Add your domain here
    # ... other domains
```

### Modifying Tools

Update `mise.toml` in the project root to change tool versions:

```toml
[tools]
node = "20.11.0"
pnpm = "9.15.2"
```

### VS Code Extensions

Add extensions to `devcontainer.json`:

```json
"extensions": [
  "anthropic.claude-code",
  "your.extension-id"
]
```

## Notes

- The container runs as the `vscode` user (UID 1001) for security
- Sudo access is restricted after initial setup for security
- The firewall script requires NET_ADMIN and NET_RAW capabilities
- All mise-managed tools are automatically trusted and installed
