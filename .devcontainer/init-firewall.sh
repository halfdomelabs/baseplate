#!/bin/bash
set -euo pipefail
IFS=$'\n\t'
trap 'echo "ERROR: Command \"$BASH_COMMAND\" failed at line $LINENO (exit code $?)" >&2' ERR

# ============================================================================
# Devcontainer firewall — dnsmasq + Squid proxy
#
# Based on https://github.com/PJUllrich/devcontainer
#
# Uses dnsmasq for DNS allowlisting and Squid as a transparent proxy for
# all outbound HTTP/HTTPS traffic, both filtering by allowed-domains.txt.
#
# DNS:  dnsmasq on 127.0.0.1 — only forwards allowed domains, NXDOMAIN else
# HTTP:  Port 80  → Squid intercept port 3129 (reads Host header)
# HTTPS: Port 443 → Squid intercept port 3130 (reads SNI via peek-and-splice)
# GitHub: Forward proxy on port 3128 (ssl_bump for token injection)
#
# Idempotent: iptables are always refreshed; services are only started if not
# already running.
# ============================================================================

# --- Block all IPv6 traffic (except loopback) ---
ip6tables -P INPUT DROP
ip6tables -P FORWARD DROP
ip6tables -P OUTPUT DROP
ip6tables -A INPUT -i lo -j ACCEPT
ip6tables -A OUTPUT -o lo -j ACCEPT

# --- Detect upstream DNS ---
# On first run, read from Docker's resolv.conf and save for re-runs.
# On re-runs, resolv.conf points to dnsmasq (127.0.0.1), so use saved value.
UPSTREAM_DNS_FILE="/run/upstream-dns"
if [ -f "$UPSTREAM_DNS_FILE" ]; then
    UPSTREAM_DNS=$(cat "$UPSTREAM_DNS_FILE")
else
    UPSTREAM_DNS=$(awk '/^nameserver/ {print $2; exit}' /etc/resolv.conf)
    echo "$UPSTREAM_DNS" > "$UPSTREAM_DNS_FILE"
fi
if [ -z "$UPSTREAM_DNS" ] || [ "$UPSTREAM_DNS" = "127.0.0.1" ]; then
    echo "ERROR: Could not detect upstream DNS (got '${UPSTREAM_DNS:-empty}')"
    exit 1
fi
echo "Upstream DNS: $UPSTREAM_DNS"

# --- Preserve Docker internal DNS NAT rules before flushing ---
DOCKER_DNS_RULES=$(iptables-save -t nat | grep "${UPSTREAM_DNS//./\\.}" || true)

# --- Flush all existing rules ---
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# --- Restore Docker DNS NAT rules ---
if [ -n "$DOCKER_DNS_RULES" ]; then
    echo "Restoring Docker DNS NAT rules..."
    iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
    iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
    echo "$DOCKER_DNS_RULES" | xargs -L 1 iptables -t nat
else
    echo "No Docker DNS NAT rules to restore"
fi

# --- Generate configs and start services (first run only) ---
if ! pgrep -x squid >/dev/null 2>&1; then
    echo "First run: generating configs and starting services..."

    # --- Generate regex domain list for ssl_bump filtering ---
    SSL_REGEX="/etc/squid/allowed-ssl-domains.regex"
    > "$SSL_REGEX"
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        if [[ "$line" == .* ]]; then
            bare="${line#.}"
            escaped="${bare//./\\.}"
            echo "(^|\\.)${escaped}$" >> "$SSL_REGEX"
        else
            escaped="${line//./\\.}"
            echo "^${escaped}$" >> "$SSL_REGEX"
        fi
    done < /etc/squid/allowed-domains.txt
    echo "Generated $(wc -l < "$SSL_REGEX") SSL regex rules"

    # --- Generate dnsmasq allowed domain forwarding rules ---
    DNSMASQ_DOMAINS="/etc/dnsmasq.d/allowed-domains.conf"
    > "$DNSMASQ_DOMAINS"
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        if [[ "$line" == .* ]]; then
            bare="${line#.}"
            echo "server=/${bare}/${UPSTREAM_DNS}" >> "$DNSMASQ_DOMAINS"
        else
            echo "server=/${line}/${UPSTREAM_DNS}" >> "$DNSMASQ_DOMAINS"
        fi
    done < /etc/squid/allowed-domains.txt
    echo "Generated $(wc -l < "$DNSMASQ_DOMAINS") dnsmasq forwarding rules"

    # --- Generate squid.conf from template with GH_TOKEN ---
    SECRETS_FILE="/run/secrets/devcontainer.env"
    if [ -f "$SECRETS_FILE" ]; then
        set -a; source "$SECRETS_FILE"; set +a
    fi
    if [ -n "${GH_TOKEN:-}" ]; then
        export GH_TOKEN_BASE64=$(printf 'x-access-token:%s' "$GH_TOKEN" | base64 -w0)
        export GH_TOKEN
        envsubst '${GH_TOKEN_BASE64} ${GH_TOKEN}' < /etc/squid/squid.conf.template > /etc/squid/squid.conf
        echo "Squid config generated with GH_TOKEN"
    else
        echo "WARNING: GH_TOKEN not set. GitHub auth disabled."
        sed '/request_header_\(access\|add\) Authorization/d' /etc/squid/squid.conf.template > /etc/squid/squid.conf
    fi
    chown proxy:proxy /etc/squid/squid.conf && chmod 640 /etc/squid/squid.conf
    unset GH_TOKEN GH_TOKEN_BASE64 2>/dev/null || true

    SERVICES_NEED_START=true
else
    echo "Services already running, refreshing iptables only..."
    SERVICES_NEED_START=false
fi

# --- Set up iptables rules ---

# DNS: only root, dnsmasq, and proxy (Squid) may query upstream DNS.
# These rules must come BEFORE the loopback ACCEPT to override it.
iptables -A OUTPUT -p udp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner root -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner root -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner dnsmasq -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner dnsmasq -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner proxy -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -d "$UPSTREAM_DNS" -m owner --uid-owner proxy -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -d "$UPSTREAM_DNS" -j REJECT
iptables -A OUTPUT -p tcp --dport 53 -d "$UPSTREAM_DNS" -j REJECT

# Allow traffic to/from upstream DNS (may be on a virtual Docker interface, not loopback)
iptables -A INPUT -s "$UPSTREAM_DNS" -p udp --sport 53 -j ACCEPT
iptables -A INPUT -s "$UPSTREAM_DNS" -p tcp --sport 53 -j ACCEPT

# Allow loopback (needed for proxy on 127.0.0.1 and other local services)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established/related connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow host network (VS Code, Docker comms)
HOST_IP=$(ip route | grep default | cut -d" " -f3)
if [ -z "$HOST_IP" ]; then
    echo "ERROR: Failed to detect host IP"
    exit 1
fi
HOST_NETWORK=$(echo "$HOST_IP" | sed "s/\.[0-9]*$/.0\/24/")
echo "Host network: $HOST_NETWORK"
iptables -A INPUT -s "$HOST_NETWORK" -j ACCEPT
iptables -A OUTPUT -d "$HOST_NETWORK" -j ACCEPT

# Allow host.docker.internal (resolves to a different subnet on Docker Desktop)
# Use /etc/hosts directly since dnsmasq won't resolve this on re-runs
DOCKER_HOST_IP=$(awk '/host.docker.internal/ {print $1; exit}' /etc/hosts)
if [ -n "$DOCKER_HOST_IP" ]; then
    echo "host.docker.internal: $DOCKER_HOST_IP"
    iptables -A INPUT -s "$DOCKER_HOST_IP" -j ACCEPT
    iptables -A OUTPUT -d "$DOCKER_HOST_IP" -j ACCEPT
fi

# Allow Squid (proxy user) to make direct outbound connections
iptables -A OUTPUT -p tcp --dport 80 -m owner --uid-owner proxy -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -m owner --uid-owner proxy -j ACCEPT

# Allow redirected traffic to reach Squid's local ports
iptables -A OUTPUT -p tcp --dport 3129 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 3130 -j ACCEPT

# Redirect all other outbound HTTP/HTTPS to Squid
iptables -t nat -A OUTPUT -p tcp --dport 80 -m owner ! --uid-owner proxy -j REDIRECT --to-port 3129
iptables -t nat -A OUTPUT -p tcp --dport 443 -m owner ! --uid-owner proxy -j REDIRECT --to-port 3130

# Set default DROP policy
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Explicit reject for clear error messages on non-allowed traffic
iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

# --- Start services (first run only) ---
if [ "$SERVICES_NEED_START" = true ]; then
    # Start dnsmasq FIRST so Squid can use it for DNS resolution.
    # This ensures both client and Squid resolve to the same IPs,
    # preventing host_verify_strict false positives.
    echo "Starting dnsmasq..."
    dnsmasq
    if ! pgrep -x dnsmasq >/dev/null 2>&1; then
        echo "ERROR: dnsmasq failed to start"
        cat /var/log/dnsmasq.log 2>/dev/null || true
        exit 1
    fi
    echo "dnsmasq started (PID: $(pgrep -x dnsmasq | head -1))"

    # Point resolv.conf to dnsmasq before starting Squid
    echo "nameserver 127.0.0.1" > /etc/resolv.conf

    echo "Starting Squid..."
    rm -f /run/squid.pid
    squid
    sleep 2

    if ! pgrep -x squid >/dev/null 2>&1; then
        echo "ERROR: Squid failed to start. Check /var/log/squid/cache.log"
        tail -20 /var/log/squid/cache.log 2>/dev/null || true
        exit 1
    fi
    echo "Squid started (PID: $(pgrep -x squid | head -1))"
    chmod 644 /var/log/squid/access.log 2>/dev/null || true
else
    # On re-runs, resolv.conf should already point to dnsmasq
    echo "nameserver 127.0.0.1" > /etc/resolv.conf
fi

# --- Verification ---
echo "Verifying firewall rules..."

# Test DNS works after iptables lockdown (via dnsmasq)
echo -n "DNS resolution (allowed domain): "
if getent hosts api.github.com >/dev/null 2>&1; then
    echo "OK"
else
    echo "FAILED"
    echo "DEBUG: DNS may be broken. Checking dnsmasq..."
    echo "nameserver entries:"
    cat /etc/resolv.conf
    echo "dnsmasq log:"
    tail -10 /var/log/dnsmasq.log 2>/dev/null || echo "(empty)"
    echo "iptables OUTPUT chain:"
    iptables -L OUTPUT -n -v 2>/dev/null | head -15
    exit 1
fi

# Test DNS filtering (blocked domain should return NXDOMAIN)
echo -n "DNS filtering (blocked domain): "
if getent hosts example.com >/dev/null 2>&1; then
    echo "FAILED — example.com resolved (should be NXDOMAIN)"
    exit 1
else
    echo "PASS: example.com returned NXDOMAIN"
fi

if curl --connect-timeout 5 https://example.com >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - was able to reach https://example.com"
    exit 1
else
    echo "PASS: example.com blocked"
fi

if ! curl --connect-timeout 10 https://api.github.com/zen >/dev/null 2>&1; then
    echo "ERROR: Firewall verification failed - unable to reach https://api.github.com"
    echo "DEBUG: Squid access.log:"
    tail -5 /var/log/squid/access.log 2>/dev/null || echo "(empty)"
    echo "DEBUG: Squid cache.log:"
    tail -10 /var/log/squid/cache.log 2>/dev/null || echo "(empty)"
    exit 1
else
    echo "PASS: api.github.com reachable"
fi

# Test forward proxy GitHub auth (non-fatal — token may not be configured)
if [ -f /run/secrets/devcontainer.env ]; then
    echo -n "Forward proxy auth: "
    if curl -s --connect-timeout 10 -x http://127.0.0.1:3128 \
        --cacert /etc/squid/bump.crt \
        https://api.github.com/user 2>/dev/null | jq -e '.login' >/dev/null 2>&1; then
        echo "OK"
    else
        echo "FAILED (check GH_TOKEN)"
    fi
fi

echo "Firewall and proxy configuration complete"
