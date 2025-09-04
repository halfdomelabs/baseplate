FROM ubuntu:noble

ARG TZ="America/Los_Angeles"
ENV TZ="$TZ"

ARG USERNAME=vscode
ARG USER_UID=1001
ARG USER_GID=$USER_UID

# Install system dependencies

RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
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

# Add users
RUN groupadd --gid $USER_GID $USERNAME \
  && useradd --uid $USER_UID --gid $USER_GID -m -s /bin/zsh $USERNAME

RUN usermod -aG sudo $USERNAME && \
  echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME

ENV HOME=/home/$USERNAME

# Install starship
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y

# Support command history

RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory \
  && echo "$SNIPPET" >> "/home/$USERNAME/.bashrc" \
  && chown $USERNAME /home/$USERNAME/.bashrc

# Set up zshrc and inputrc
COPY .devcontainer/.zshrc /home/$USERNAME/.zshrc
RUN chown $USERNAME /home/$USERNAME/.zshrc

COPY .devcontainer/.inputrc /home/$USERNAME/.inputrc
RUN chown $USERNAME /home/$USERNAME/.inputrc

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

# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Set the default editor and visual
ENV EDITOR=vim
ENV VISUAL=vim

# Install Claude
RUN zsh -c "source ${ZDOTDIR-$HOME}/.zshrc && npm install -g @anthropic-ai/claude-code@latest"

# Install zplug
ENV ZPLUG_HOME="$HOME/.zplug"
RUN git clone https://github.com/zplug/zplug.git $ZPLUG_HOME

# Add firewall script
USER root
COPY .devcontainer/init-firewall.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "Defaults secure_path=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\"\n$USERNAME ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/user-firewall && \
  chmod 0440 /etc/sudoers.d/user-firewall

USER $USERNAME
