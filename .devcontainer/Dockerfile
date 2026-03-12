FROM ubuntu:noble

ARG TZ="America/Los_Angeles"
ENV TZ="$TZ"

ARG CLAUDE_CODE_VERSION=latest

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Install system dependencies

RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
  zsh \
  fzf \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  iproute2 \
  dnsutils \
  squid-openssl \
  dnsmasq \
  gettext-base \
  jq \
  nano \
  vim \
  ca-certificates \
  build-essential \
  curl \
  bubblewrap \
  socat \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Remove default ubuntu user/group (occupies UID/GID 1000) and create our own
RUN (userdel -r ubuntu 2>/dev/null || true) \
  && (groupdel ubuntu 2>/dev/null || true) \
  && groupadd --gid $USER_GID $USERNAME \
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
COPY .devcontainer/conf/.zshrc /home/$USERNAME/.zshrc
RUN chown $USERNAME /home/$USERNAME/.zshrc

COPY .devcontainer/conf/.inputrc /home/$USERNAME/.inputrc
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
COPY --chown=$USERNAME:$USERNAME .devcontainer/conf/starship.toml .config/starship.toml

# Copy the mise configuration file into the container
# This file defines which tools and versions mise should install (e.g., node, pnpm)
COPY --chown=$USERNAME:$USERNAME mise.toml .config/mise/config.toml

# Install all tools defined in the config file using mise
RUN mise install
# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Set the default editor and visual
ENV EDITOR=vim
ENV VISUAL=vim

# Install Claude
RUN zsh -c "source ${ZDOTDIR-$HOME}/.zshrc && npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}"

# Install zplug
ENV ZPLUG_HOME="$HOME/.zplug"
RUN git clone https://github.com/zplug/zplug.git $ZPLUG_HOME

# Add firewall script
USER root
COPY .devcontainer/init-firewall.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "Defaults secure_path=\"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\"\n$USERNAME ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/user-firewall && \
  chmod 0440 /etc/sudoers.d/user-firewall

# Initialize Squid directories, certs, and SSL database
RUN mkdir -p /var/log/squid /var/spool/squid && \
  chown -R proxy:proxy /var/log/squid /var/spool/squid && \
  chmod 755 /var/log/squid && \
  openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
  -subj "/CN=squid-bump" \
  -keyout /etc/squid/bump.key -out /etc/squid/bump.crt && \
  chmod 600 /etc/squid/bump.key && chmod 644 /etc/squid/bump.crt && \
  chown proxy:proxy /etc/squid/bump.key /etc/squid/bump.crt && \
  /usr/lib/squid/security_file_certgen -c -s /var/spool/squid/ssl_db -M 4MB && \
  chown -R proxy:proxy /var/spool/squid/ssl_db

# Add Squid CA cert to system trust store (for bumped GitHub connections)
RUN cp /etc/squid/bump.crt /usr/local/share/ca-certificates/squid-bump.crt && \
  update-ca-certificates

# Copy Squid config template and allowed domains list
COPY .devcontainer/conf/squid.conf.template /etc/squid/squid.conf.template
COPY .devcontainer/allowed-domains.txt /etc/squid/allowed-domains.txt

# Copy dnsmasq config and create conf.d directory
COPY .devcontainer/conf/dnsmasq.conf /etc/dnsmasq.conf
RUN mkdir -p /etc/dnsmasq.d

USER $USERNAME
