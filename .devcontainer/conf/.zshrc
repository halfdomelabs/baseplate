# Set up proper encoding
export LANG=C.UTF-8
export LC_ALL=C.UTF-8

# Set up zplug
if [ -f ~/.zplug/init.zsh ]; then
    source ~/.zplug/init.zsh

    zplug "zsh-users/zsh-syntax-highlighting", at:e0165eaa730dd0fa32, defer:2
    zplug "zsh-users/zsh-autosuggestions", at:c3d4e576c9c86eac62884

    if ! zplug check; then
        zplug install
    fi

    zplug load
fi

bindkey -e
bindkey '^E' autosuggest-accept

# History settings

export HISTFILE=/commandhistory/.bash_history
SAVEHIST=10000
setopt APPEND_HISTORY
setopt INC_APPEND_HISTORY
setopt SHARE_HISTORY
setopt HIST_IGNORE_SPACE
