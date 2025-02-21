# Terracoast - Application de Quiz Géographique

## 1. Introduction
Terracoast est une application ludique et interactive qui permet aux utilisateurs d'améliorer leurs connaissances en géographie à travers des quiz variés. Le jeu intègre un système de progression, des duels entre joueurs et des classements mondiaux. Avec un design coloré et une mascotte koala attachante, l'application vise à rendre l'apprentissage amusant et stimulant.

## 2. Fonctionnalités Clés

### 2.1. Langues
- Multilingue (Français, Anglais, Espagnol, etc).
- Option de changement de langue dans le profil.
- Chargement dynamique des textes pour une personnalisation fluide.

### 2.2. Gestion de Profil
- **Système de niveaux** avec des titres visuels :
  - Cancre (bronze)
  - Pèlerin (vert)
  - Rogue (rouge feu)
  - Noosphère (violet)
  - Arcane (doré)
- **Badges** visibles sur les profils, attribués selon les performances et l'ancienneté.
- **Titres spéciaux** :
  - "Diligent" (1er d'un quiz spécifique).
  - "Ouroboros" (ancien compte).

### 2.3. Création de Profil
- Inscription avec :
  - Pseudo
  - Adresse email (pour newsletters et récupération de compte)
  - Mot de passe sécurisé
- Authentification via OAuth2 / JWT
- Validation des informations et récupération de mot de passe

### 2.4. Création de Quiz
- **Mode Admin** :
  - Création de quiz publics visibles par tous.
- **Mode Personnel** :
  - Création de quiz privés et partageable avec un lien unique.
- Interface intuitive pour ajouter questions, images et réponses.

### 2.5. Compétition et Classements
- **Duel** :
  - Mode Quiz-Duel où deux joueurs répondent aux mêmes questions en simultané.
  - Victoire basée sur rapidité et exactitude.
- **Classement** :
  - Affichage des scores mondiaux et par région.
  - Rangs visibles sur le profil.

### 2.6. Types de Quiz et Réponses
- Quiz basés sur :
  - Drapeaux par continent
  - Pays et leurs capitales
  - Cartes avec un pays coloré et propositions de réponse
  - Cartes vierges avec nom de pays
  - Mode type GeoGuessr (deviner un lieu à partir d'une image)
  - Langue parlée dans le pays
  - Monnaie utilisé dans le pays 
  - lieux mythique du pays
- **Méthodes de réponse** :
  - Choix multiple
  - Saisie manuelle
  - Clic sur une carte interactive
- Notation des quiz (1 à 5 étoiles) après la première complétion.
- Système d'expérience (EXP) pour monter en niveau.

### 2.7. Design et Expérience Utilisateur
- **Style graphique** inspiré de Duolingo :
  - Couleurs vives et animations engageantes.
  - Mascotte Koala pour guider l'utilisateur.
- Interface fluide et accessible.

### 2.8. Soutien via Patreon
- Possibilité de soutenir le projet via Patreon.
- Avantages pour les contributeurs :
  - Badges exclusifs
  - Contenus supplémentaires
  - Personnalisation avancée du profil

## 3. Sécurité et Backend
- **Sécurité** :
  - Certificat SSL pour protéger les données.
  - Protection contre les bots (CAPTCHA, vérifications supplémentaires).
- **Backend** :
  - API REST/PostgresSQL pour gérer les utilisateurs et les quiz.
  - Hébergement sur O2SWITCH.
- **Tests** :
  - Tests utilisateurs pour optimiser l'UX/UI.
  - Tests unitaires et d'intégration pour assurer la stabilité.

**Terracoast** a pour but de rendre l'apprentissage de la géographie ludique et interactif tout en offrant un environnement compétitif et engageant. 🚀

## 4. Technologies Utilisées

### **Frontend (Interface Utilisateur)**
#### **Framework & UI**
- **React.js** – Pour le développement web.  
- **React Native** (pour la future app mobile).  
- **Next.js** – Pour le rendu côté serveur (SEO & performances).  
- **Tailwind CSS** – Pour un design rapide et responsive.  
- **Shadcn/UI** – Pour des composants modernes et accessibles.  
- **Framer Motion** – Pour les animations fluides.  

#### **Gestion d'état**
- **Zustand** ou **Redux Toolkit** – Pour gérer l'état global de l'application.  
- **React Query (TanStack Query)** – Pour la gestion des requêtes API et cache.  

#### **Cartographie & Géolocalisation**
- **Leaflet.js** ou **Mapbox** – Pour les cartes interactives et modes de jeu type GeoGuessr.  
- **OpenStreetMap API** – Pour récupérer des données géographiques.  

#### **Authentification & Sécurité**
- **NextAuth.js** – Pour l'authentification OAuth, JWT et sécurisation des sessions.  
- **bcrypt.js** – Pour hacher les mots de passe.  

#### **Multilingue & Accessibilité**
- **react-i18next** – Pour la gestion des traductions.  
- **Headless UI & Radix UI** – Pour l'accessibilité et les composants UI interactifs.  


### **Backend (API & Base de Données)**
#### **Serveur & API**
- **Node.js** + **Express.js** – Pour gérer les routes API et la logique métier.  
- **tRPC** – Pour un backend type API en TypeScript, avec autocomplétion.  
- **PostgreSQL** – Base de données relationnelle robuste.  
- **Redis** – Pour la mise en cache et le stockage des sessions.  

#### **Sécurité Backend**
- **Helmet.js** – Pour sécuriser l'API.  
- **Rate Limiting (express-rate-limit)** – Pour éviter le spam d'API.  
- **CSRF Protection** – Sécurisation des requêtes.  

## 5. Structure de l'Application
npx tailwindcss init -p
### Architecture des Dossiers
```
Terracoast-V2/
├── src/
│ ├── app/ # Pages et routes Next.js
│ ├── components/ # Composants React réutilisables
│ │ ├── ui/ # Composants UI de base
│ │ ├── forms/ # Composants de formulaires
│ │ ├── quiz/ # Composants spécifiques aux quiz
│ │ └── maps/ # Composants de cartographie
│ ├── hooks/ # Hooks React personnalisés
│ ├── lib/ # Utilitaires et configurations
│ ├── styles/ # Styles globaux et thèmes
│ ├── types/ # Types TypeScript
│ ├── utils/ # Fonctions utilitaires
│ └── services/ # Services (API, auth, etc.)
├── public/ # Assets statiques
├── prisma/ # Schémas et migrations Prisma
├── tests/ # Tests unitaires et d'intégration
└── locales/ # Fichiers de traduction
```
## 6. Schéma de la Base de Données

### Tables Principales

#### Users
```sql
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
username VARCHAR(50) UNIQUE NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
last_login TIMESTAMP WITH TIME ZONE,
experience_points INTEGER DEFAULT 0,
level INTEGER DEFAULT 1,
is_admin BOOLEAN DEFAULT FALSE,
preferred_language VARCHAR(10) DEFAULT 'fr',
avatar_url TEXT,
is_premium BOOLEAN DEFAULT FALSE
);
```

#### Quizzes
```sql
CREATE TABLE quizzes (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
creator_id UUID REFERENCES users(id),
title JSONB NOT NULL, -- Pour le multilingue {fr: "titre", en: "title"}
description JSONB,
difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
category VARCHAR(50) NOT NULL,
is_public BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
average_rating DECIMAL(3,2),
times_played INTEGER DEFAULT 0
);
```

#### Questions
```sql
CREATE TABLE questions (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
question_text JSONB NOT NULL,
question_type VARCHAR(50) NOT NULL, -- multiple_choice, text_input, map_click
media_url TEXT,
points INTEGER DEFAULT 10,
time_limit INTEGER, -- en secondes
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Réponses
```sql
CREATE TABLE answers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
answer_text JSONB NOT NULL,
is_correct BOOLEAN NOT NULL,
explanation JSONB
);
```
#### UserProgress
```sql
CREATE TABLE user_progress (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES users(id),
quiz_id UUID REFERENCES quizzes(id),
score INTEGER NOT NULL,
completion_time INTEGER, -- en secondes
completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
answers_data JSONB -- stockage des réponses détaillées
);
```
#### Badges
```ql
CREATE TABLE badges (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name JSONB NOT NULL,
description JSONB NOT NULL,
icon_url TEXT NOT NULL,
requirement_type VARCHAR(50),
requirement_value INTEGER
);
```
#### UserBadges
```sql
sql
CREATE TABLE user_badges (
user_id UUID REFERENCES users(id),
badge_id UUID REFERENCES badges(id),
earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (user_id, badge_id)
);
```
#### Duels
```sql
CREATE TABLE duels (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
quiz_id UUID REFERENCES quizzes(id),
player1_id UUID REFERENCES users(id),
player2_id UUID REFERENCES users(id),
player1_score INTEGER DEFAULT 0,
player2_score INTEGER DEFAULT 0,
status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
completed_at TIMESTAMP WITH TIME ZONE
);
```
#### QuizRatings
```sql
CREATE TABLE quiz_ratings (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES users(id),
quiz_id UUID REFERENCES quizzes(id),
rating INTEGER CHECK (rating BETWEEN 1 AND 5),
comment TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
UNIQUE(user_id, quiz_id)
);
```
### Tables de Support

#### UserSettings
```sql
CREATE TABLE user_settings (
user_id UUID PRIMARY KEY REFERENCES users(id),
notification_preferences JSONB,
ui_preferences JSONB,
privacy_settings JSONB
);
```
#### QuizCategories
```sql
CREATE TABLE quiz_categories (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name JSONB NOT NULL,
description JSONB,
icon_url TEXT
);
```
#### Achievements
```sql
CREATE TABLE achievements (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name JSONB NOT NULL,
description JSONB NOT NULL,
requirement_type VARCHAR(50),
requirement_value INTEGER,
icon_url TEXT
);
```
#### UserAchievements
```sql
CREATE TABLE user_achievements (
user_id UUID REFERENCES users(id),
achievement_id UUID REFERENCES achievements(id),
earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (user_id, achievement_id)
);
```
### Index et Optimisations
```sql
-- Index pour améliorer les performances des requêtes fréquentes
CREATE INDEX idx_quiz_category ON quizzes(category);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_quiz ON user_progress(quiz_id);
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_duels_players ON duels(player1_id, player2_id);
-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_updated_at
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```
