#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL est obligatoire. Exemple: postgresql://USER:PASSWORD@HOST:5432/fasotontine}"

psql "$DATABASE_URL" -f "$(dirname "$0")/../database/migrations/002_seed_demo_data.sql"
