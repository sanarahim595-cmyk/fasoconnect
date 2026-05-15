# Database

Base PostgreSQL de FasoTontine.

## Fichiers

- `init.sql` : script charge par Docker Compose au premier demarrage.
- `migrations/001_initial_schema.sql` : schema relationnel initial complet.

## Acces local

- Host : `localhost`
- Port : `5432`
- Database : `fasotontine`
- User/password : definis via variables d'environnement, ne pas les commiter.

## Initialisation

Avec Docker Compose, le schema est charge automatiquement au premier demarrage du volume PostgreSQL :

```bash
docker compose up -d postgres
```

Avec `psql` :

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fasotontine"
.\scripts\init-database.ps1
```

ou :

```bash
./scripts/init-database.sh
```

## Relations principales

- `users` est la table centrale des membres, administrateurs et partenaires.
- `cnib_verifications` appartient a `users` et stocke les controles CNIB/OCR avec les statuts `pending`, `verified`, `rejected` et `manual_review`.
- `tontines` est creee par un utilisateur organisateur.
- `tontine_members` relie les utilisateurs aux tontines avec role, statut et ordre de passage.
- `contributions` appartient a un membre de tontine et trace les paiements par cycle.
- `guarantors` relie un membre de tontine a son garant utilisateur.
- `incidents` enregistre retards, defauts apres paiement, litiges et appels au garant.
- `votes`, `vote_options` et `vote_responses` couvrent les votes de regles, incidents, membres et projets.
- `community_projects` stocke les projets geolocalises soumis par mairies, ONG ou partenaires.
- `project_images` stocke les preuves visuelles, recus, photos CNIB ou photos d'avancement.
- `notifications` cible les utilisateurs et peut referencer une tontine ou un projet.
- `admin_actions` garde l'audit des actions sensibles d'administration.
