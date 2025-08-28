FROM ubuntu:noble

ARG TZ
ENV TZ="$TZ"

ARG USERNAME=vscode

# Add users
RUN groupadd $USERNAME && useradd -g $USERNAME -ms /bin/zsh $USERNAME

RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  jq \
  nano \
  vim \
  ca-certificates \
  build-essential \
  curl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/$USERNAME

# Install starship
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y

USER $USERNAME

# Install Mise and then install tools from the config file in a single RUN command

ENV MISE_DATA_DIR="$HOME/.local/share/mise"
ENV MISE_CONFIG_DIR="$HOME/.config/mise"
ENV MISE_CACHE_DIR="$HOME/.cache/mise"
ENV PATH="/mise/shims:$HOME/.local/bin:$PATH"
ENV MISE_IDIOMATIC_VERSION_FILE_ENABLE_TOOLS=[]
ENV MISE_TRUSTED_CONFIG_PATHS="$HOME/.config/mise/config.toml"

RUN curl https://mise.run | sh

# Add to zsh and bash
RUN echo 'eval "$(mise activate bash)"' >> ~/.bashrc
RUN echo 'eval "$(mise activate zsh)"' >> "${ZDOTDIR-$HOME}/.zshrc"

# Activate Starship
RUN echo 'eval "$(starship init zsh)"' >> "${ZDOTDIR-$HOME}/.zshrc"

# Set the working directory to the user's home
WORKDIR /home/$USERNAME

# Copy starship.toml
COPY --chown=$USERNAME:$USERNAME .devcontainer/starship.toml .config/starship.toml

# Copy the mise configuration file into the container
# This file defines which tools and versions mise should install (e.g., node, pnpm)
COPY --chown=$USERNAME:$USERNAME mise.toml .config/mise/config.toml

# Install all tools defined in the config file using mise
RUN mise install

# Configure pnpm to use a specific store directory within the user's home
ENV npm_config_store_dir="$HOME/.local/share/pnpm/store"
