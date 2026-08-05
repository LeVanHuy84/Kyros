# GitHub Actions CI/CD Secrets Setup Guide

This document lists the required environment secrets and configuration steps needed to enable automated Continuous Deployment (CD) to your VPS via GitHub Actions.

---

## 🔐 GitHub Repository Secrets Configuration

To allow the GitHub Actions runner to securely build, publish, copy configuration, and execute deployment commands on your remote server, you must add the following variables as **Repository Secrets** in your GitHub repository.

### How to Add Secrets:
1. Navigate to your repository page on GitHub.
2. Click on **Settings** (tab at the top).
3. In the left sidebar, expand **Secrets and variables** and select **Actions**.
4. Click on **New repository secret** for each variable listed below.

---

### Required Secrets List

| Secret Name | Category | Nullability | Description & Example |
| :--- | :--- | :--- | :--- |
| `VPS_HOST` | Infrastructure | **Required** | The public IP address or Domain Name of your VPS. <br> *Example: `198.51.100.12` or `deploy.myassistant.com`* |
| `VPS_USERNAME` | Infrastructure | **Required** | The SSH connection username. <br> *Example: `root` or `ubuntu`* |
| `VPS_SSH_KEY` | Infrastructure | **Required** | The entire private SSH key content (including headers) used to authenticate against the VPS. <br> *Example: `-----BEGIN OPENSSH PRIVATE KEY----- ... -----END OPENSSH PRIVATE KEY-----`* |
| `VPS_TARGET_DIR` | Infrastructure | **Required** | The target directory path on the VPS where the `compose.yaml` and `.env` files will reside. <br> *Example: `/opt/ai-executive-assistant`* |
| `DB_PASSWORD` | Application | **Required** | A secure database password used to initialize and secure the production PostgreSQL instance. <br> *Example: `e2B4-secure_postgres_pass-92`* |
| `JWT_SECRET` | Application | **Required** | A cryptographically secure secret key (at least 256 bits / 32 bytes long) used to sign and verify JSON Web Tokens (JWT). <br> *Example: `7ad88fe99238bcde2829283fccba881177bbaacc88231`* |
| `DB_USERNAME` | Application | *Optional* | The database username. Defaults to `assistant_user` if not specified. |
| `VPS_PORT` | Infrastructure | *Optional* | The custom SSH connection port of your VPS. Defaults to `22` if not specified. |

---

## 🛠️ Remote Server (VPS) Prerequisites

Before launching the deployment pipeline, ensure the following steps are performed on your VPS:

1. **Docker Engine & Compose Installation**:
   Install Docker on your VPS:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Verify docker compose is available (Docker version 20.10+ has compose plugin)
   docker compose version
   ```

2. **SSH Configuration**:
   Ensure that the public key matching the private key in `VPS_SSH_KEY` is added to the user's `~/.ssh/authorized_keys` file on the VPS:
   ```bash
   mkdir -p ~/.ssh
   echo "your-ssh-public-key-here" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Directory Provisioning**:
   Pre-create the deployment directory on the VPS (with appropriate write ownership for the SSH user):
   ```bash
   sudo mkdir -p /opt/ai-executive-assistant
   sudo chown -R $USER:$USER /opt/ai-executive-assistant
   ```
