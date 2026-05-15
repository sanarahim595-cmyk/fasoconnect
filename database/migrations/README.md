# Migrations

Ce dossier contient les migrations SQL de FasoTontine.

## Fichiers

- `001_initial_schema.sql` : schema PostgreSQL initial complet.

## Application manuelle

```bash
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
```

Sur Windows PowerShell :

```powershell
.\scripts\init-database.ps1
```

## Tables creees

- `users`
- `cnib_verifications`
- `tontines`
- `tontine_members`
- `contributions`
- `guarantors`
- `incidents`
- `votes`
- `vote_options`
- `vote_responses`
- `community_projects`
- `project_images`
- `notifications`
- `admin_actions`

Une table technique `app_health_checks` est aussi creee pour verifier que la base est prete.
