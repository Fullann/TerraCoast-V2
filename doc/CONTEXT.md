# Terracoast - Application de Quiz Géographique

## 1. Introduction
Terracoast est une application ludique et interactive qui permet aux utilisateurs d'améliorer leurs connaissances en géographie à travers des quiz variés. Le jeu intègre un système de progression, des duels entre joueurs, des classements mondiaux et des quêtes quotidiennes. Avec un design coloré et une mascotte koala attachante, l'application vise à rendre l'apprentissage amusant et stimulant.

## 2. Fonctionnalités Clés

### 2.1. Langues
- Multilingue (Français, Anglais, Espagnol, etc.).
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

### 2.4. Quiz et Types de Questions
- Quiz basés sur :
  - Drapeaux par continent
  - Pays et leurs capitales
  - Cartes avec un pays coloré et propositions de réponse
  - Cartes vierges avec nom de pays
  - Mode type GeoGuessr (deviner un lieu à partir d'une image)
  - Langue parlée dans chaque pays
  - Monnaie utilisée dans chaque pays
  - Lieux mythiques du pays
  - Religion et traditions
  - Nombre d'habitants
  - Cantons et subdivisions
  - PIB des pays
- **Méthodes de réponse** :
  - Choix multiple
  - Saisie manuelle
  - Clic sur une carte interactive
- Notation des quiz (1 à 5 étoiles) après la première complétion.
- Système d'expérience (EXP) pour monter en niveau.
- Création de quiz
  - Quiz créer par les admins dispo pour tout le monde
  - Quiz perso on peut les partagers via un lien mais il ne sont pas disponile sur la page d'acceuil


### 2.5. Mode Duel et Compétition
- **Duel sur un pays** : Deux joueurs reçoivent des questions sur un même pays (capitale, population, langue, etc.) et celui qui se rapproche le plus de la bonne réponse gagne.
- **Duels thématiques** : Duel sur des catégories spécifiques (ex : drapeaux, villes, économie).
- **Mode Événement** : Quiz temporaires sur des événements géographiques actuels (ex : éruption volcanique, JO, etc.).
- **Classement** : Affichage des scores mondiaux et par région.
- Rangs visibles sur le profil.
- Clans avec lesquelles on peut faire des combat clans contre clans 
- combat 1v1 rapidité : la meme question et celui qui repond le plus vite a les points 

### 2.6. Expérience Utilisateur et Monétisation
- **Processus d'accueil** :
  1. Arrivée sur la page d'accueil avec un quiz d'évaluation et un tuto où l'on apprend comment repondre à chaques types questions.
  2. Analyse des résultats et proposition de thèmes à apprendre en priorité.
  3. Accès aux quiz avec une limite de 10 quiz/jour (au-delà, visionnage d'une pub ou abonnement premium pour vies illimitées).
- **Navigation** :
  - Page Home : Affichage de tous les quiz avec filtres et tri personnalisé.
  - Page Quêtes : Objectifs quotidiens et bonus d'XP.
  - Page Duel : Matchmaking aléatoire et duels thématiques.
  - Page Ligue : Système de classement avec 40 joueurs par ligue. Chaque semaine :
    - Les 10 premiers montent de ligue.
    - Les joueurs classés entre 20 et 30 restent dans leur ligue.
    - Les joueurs classés entre 30 et 40 descendent de ligue.
    - Progression basée sur les XP gagnés via les quiz ou les victoires en duel.
  - Page Profil : Statistiques, badges et progression.
- **Monétisation** :
  - Publicités pour obtenir des vies supplémentaires.
  - Mode premium avec vies illimitées et avantages exclusifs.

### 2.7. Sécurité et Backend
- **Sécurité** :
  - Certificat SSL pour protéger les données.
  - Protection contre les bots (CAPTCHA, vérifications supplémentaires).
- **Backend** :
  - API REST/PostgreSQL pour gérer les utilisateurs et les quiz.
  - Hébergement sur O2SWITCH.
- **Tests** :
  - Tests utilisateurs pour optimiser l'UX/UI.
  - Tests unitaires et d'intégration pour assurer la stabilité.
### 2.8 Récompenses
- Des badges selon les performances sur des quiz, sur l'ancienneté, sur les evenements de saison sur les top leagus
- Gagner des XPs a chaque quiz resolu, lorsqu'on gagne un duel ou quand on fait un 1v1 de vitesse.
- Si dans le top 10 de ça propre leagus on monte dans la leaugue du dessus ( comme duolingo) chaque league est reset le samedi si on est en desous des 20 derniers on dessent de league.
## 3. Technologies Utilisées

### **Frontend (Interface Utilisateur)**
#### **Framework & UI**
- **React.js** – Pour le développement web.
- **React Native** (pour la future app mobile).
- **Next.js** – Pour le rendu côté serveur (SEO & performances).
- **Tailwind CSS** – Pour un design rapide et responsive.
- **Shadcn/UI** – Pour des composants modernes et accessibles.
- **Framer Motion** – Pour les animations fluides.

#### **Cartographie & Géolocalisation**
- **Leaflet.js** ou **Mapbox** – Pour les cartes interactives et modes de jeu type GeoGuessr.
- **OpenStreetMap API** – Pour récupérer des données géographiques.
- **DataSet** https://www.geonames.org/

#### **Authentification & Sécurité**
- **NextAuth.js** – Pour l'authentification OAuth, JWT et sécurisation des sessions.
- **bcrypt.js** – Pour hacher les mots de passe.

