# Setup Examples

Origin: generic mise/monorepo tutorial blocks moved out of `../SKILL.md` to keep the skill lean. These are illustrative defaults, not project rules.

## Prerequisites

```bash
# Install mise
curl https://mise.run | sh

# Activate in shell
echo 'eval "$(~/.local/bin/mise activate)"' >> ~/.zshrc

# Install all runtimes defined in mise.toml
mise install

# Verify installation
mise list
```

## Project Structure (Monorepo)

```
project-root/
├── mise.toml            # Root task definitions
├── apps/
│   ├── api/            # Backend application
│   │   └── mise.toml   # App-specific tasks
│   ├── web/            # Frontend application
│   │   └── mise.toml
│   └── mobile/         # Mobile application
│       └── mise.toml
├── packages/
│   ├── shared/         # Shared libraries
│   └── config/         # Shared configuration
└── scripts/            # Utility scripts
```

## Parallel vs Sequential Execution

**Parallel (independent tasks):**
```bash
# Runs all lint tasks simultaneously
mise run lint
```

**Sequential (dependent tasks):**
```bash
# Runs in order: lint → test → build
mise run lint && mise run test && mise run build
```

**Mixed approach:**
```bash
# Start dev servers in background
mise run //apps/api:dev &
mise run //apps/web:dev &
wait
```

## Environment Variables

Common patterns for monorepo env vars:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Cache
REDIS_URL=redis://localhost:6379/0

# API
API_URL=http://localhost:8000

# Frontend
PUBLIC_API_URL=http://localhost:8000
```
