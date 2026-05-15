# FasoTontine

FasoTontine est un prototype web/PWA pour moderniser la tontine au Burkina Faso : gestion des membres, cotisations, garants, incidents, votes et projets communautaires geolocalises.

## Stack

- Frontend : Next.js, React, TypeScript, Tailwind CSS, PWA
- Backend : Python FastAPI, SQLAlchemy, Pydantic
- Base de donnees : PostgreSQL
- Carte : Leaflet + OpenStreetMap
- Authentification : JWT, roles, mots de passe hashes

## Structure

```text
fasotontine/
  frontend/       Interface Next.js responsive et installable
  backend/        API FastAPI et logique metier
  database/       Schema SQL, init et seeds demo
  scripts/        Scripts Windows/Linux d'installation et lancement
  docker-compose.yml
```

## Installation

```powershell
.\scripts\install.ps1
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item backend\.env.example backend\.env
```

Dans `backend\.env`, configure au minimum :

```env
DATABASE_URL=postgresql+psycopg://postgres:ton_mot_de_passe@localhost:5432/fasotontine
SECRET_KEY=une-cle-longue-et-aleatoire
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Avec pgAdmin4, cree une base nommee `fasotontine`, puis execute dans l'ordre :

```sql
\i database/migrations/001_initial_schema.sql
\i database/migrations/002_seed_demo_data.sql
```

Depuis PowerShell, si `psql` est disponible :

```powershell
.\scripts\init-database.ps1
.\scripts\seed-database.ps1
```

## Lancement

Backend :

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Backend sans fenetre PowerShell visible :

```powershell
.\scripts\start-backend-hidden.ps1
```

Frontend :

```powershell
cd frontend
npm run dev -- --port 3001
```

Lancement frontend sans fenetre PowerShell visible :

```powershell
.\scripts\start-frontend-hidden.ps1
```

Adresses utiles :

- Frontend : http://localhost:3001
- API : http://localhost:8000
- Swagger : http://localhost:8000/docs

## Comptes de demonstration

Chaque compte a son propre mot de passe.

| Role | Identifiant | Mot de passe |
| --- | --- | --- |
| Administrateur plateforme | `awa.ouedraogo@demo.faso` ou `+22670010001` | `awa-admin-2026` |
| Administrateur tontine | `moussa.traore@demo.faso` ou `+22670010002` | `moussa-tontine-2026` |
| Utilisateur | `mariam.kabore@demo.faso` ou `+22670010003` | `mariam-2026` |
| Utilisateur | `omar.sawadogo@demo.faso` ou `+22670010004` | `omar-2026` |

## Inscription CNIB

Le numero CNIB est obligatoire. Le scan CNIB est facultatif pour la version de demonstration. Le backend accepte JPG, PNG, WebP et PDF comme preuve optionnelle. Le compte est marque `verified` a partir du numero CNIB saisi.


## Verification

Commandes principales :

```powershell
cd frontend; npm run lint; npm run build
cd backend; .\.venv\Scripts\python.exe -m compileall app
```

## Deploiement Vercel

Vercel doit heberger le frontend uniquement. Le backend FastAPI doit etre heberge separement sur Render, Railway ou un VPS.

1. Pousse le projet sur GitHub.
2. Dans Vercel, cree un nouveau projet depuis le repo.
3. Dans les parametres Vercel, mets `frontend` comme Root Directory.
4. Framework Preset : `Next.js`.
5. Build Command : `npm run build`.
6. Install Command : `npm install`.
7. Output Directory : laisse vide, Vercel detecte Next.js.
8. Ajoute la variable d'environnement :

```env
NEXT_PUBLIC_API_URL=https://TON-BACKEND/api/v1
```

Exemple :

```env
NEXT_PUBLIC_API_URL=https://fasotontine-api.onrender.com/api/v1
```

Apres le deploiement Vercel, ajoute le domaine Vercel dans `BACKEND_CORS_ORIGINS` du backend :

```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://TON-PROJET.vercel.app
```

Le fichier `frontend/vercel.json` configure deja les en-tetes utiles pour la PWA (`manifest.json` et `sw.js`).

## Deploiement backend

Pour Render ou Railway :

```env
APP_ENV=production
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/fasotontine
SECRET_KEY=une-cle-longue
BACKEND_CORS_ORIGINS=https://TON-PROJET.vercel.app
```

Commandes backend :

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Prototype

Cette version est presentable pour une competition universitaire. Les paiements Mobile Money reels, la blockchain, l'IA OCR avancee et le reporting analytique sont prevus comme evolutions futures.
