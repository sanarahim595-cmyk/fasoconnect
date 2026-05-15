# FasoTontine Backend

API Python FastAPI pour FasoTontine.

## Stack

- FastAPI
- SQLAlchemy 2
- PostgreSQL avec `psycopg`
- Pydantic Settings
- Swagger/OpenAPI automatique

## Installation

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m ensurepip --upgrade
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Copier l'environnement :

```powershell
Copy-Item .env.example .env
```

## Variables d'environnement

```text
APP_NAME=FasoTontine API
APP_ENV=development
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FASOTONTINE_DEBUG=false
SECRET_KEY=
UPLOAD_DIR=.runtime/uploads
MAX_UPLOAD_SIZE_BYTES=5242880
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/fasotontine
```

## Developpement

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload
```

API : http://localhost:8000  
Swagger : http://localhost:8000/docs  
OpenAPI JSON : http://localhost:8000/openapi.json

## Modules API

- `auth` : inscription, inscription avec CNIB obligatoire, connexion telephone/email, JWT, OTP simule et deconnexion client.
- `users` : utilisateurs, roles, statut et score de confiance.
- `cnib` : validations CNIB et donnees OCR.
- `tontines` : creation et gestion des tontines.
- `members` : membres, roles, ordre de passage.
- `contributions` : cotisations, paiements et retards.
- `guarantors` : garants, garanties et statut.
- `incidents` : retards, defauts, litiges et resolutions.
- `votes` : votes, options et reponses.
- `community_projects` : projets geolocalises et images de suivi.
- `notifications` : notifications in-app, email, SMS ou push.
- `admin` : audit des actions administratives.

## Structure

```text
app/
  api/
    routes/        Routeurs FastAPI par module
    crud_router.py Fabrique CRUD commune
  core/            Configuration, DB, erreurs
  middlewares/     Request ID et temps de reponse
  models/          Modeles SQLAlchemy
  schemas/         Schemas Pydantic
  services/        Logique metier et CRUD
```

## Base de donnees

La connexion est centralisee dans `app/core/database.py`. Le schema SQL complet est dans :

```text
../database/migrations/001_initial_schema.sql
```

Appliquer la migration :

```powershell
cd ..
.\scripts\init-database.ps1
```

## Notes

Les endpoints CRUD sont prets pour le prototypage et Swagger. Les regles metier avancees seront ajoutees progressivement dans `app/services/`.

## Inscription avec CNIB

Endpoint multipart :

```text
POST /api/v1/auth/register-with-cnib
```

Champs :

- `full_name`
- `phone`
- `email` optionnel
- `password_or_otp`
- `city`
- `cnib_file` obligatoire

Si aucun numero CNIB n'est detecte par OCR, l'API bloque l'inscription avec le message exact :

```text
Numéro CNIB non détecté. Veuillez scanner une CNIB lisible.
```

Si l'OCR detecte un numero avec une confiance faible, le statut CNIB devient `manual_review`.
La validation manuelle admin est disponible via :

```text
POST /api/v1/cnib/{item_id}/manual-validate
```

## Connexion et roles

Connexion :

```text
POST /api/v1/auth/login
```

Payload :

```json
{
  "identifier": "+22670000000",
  "method": "password",
  "password_or_otp": "mot-de-passe"
}
```

ou avec OTP simule :

```json
{
  "identifier": "user@email.com",
  "method": "otp",
  "password_or_otp": "123456"
}
```

Roles supportes :

- `utilisateur`
- `administrateur_tontine`
- `administrateur_plateforme`

Routes utiles :

- `GET /api/v1/auth/me` : utilisateur courant avec `Authorization: Bearer <token>`.
- `POST /api/v1/auth/logout` : reponse de deconnexion, le client supprime le token.
- Les modules metier sont proteges par JWT.
- Le module `/api/v1/admin` exige le role `administrateur_plateforme`.
