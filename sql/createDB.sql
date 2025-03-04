-- ============================================================
-- 1. Tables de base pour l'application Terracoast
-- ============================================================

-- 1.1. Table des Langues (pour gérer le multilingue)
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) NOT NULL UNIQUE,  -- par exemple 'en', 'fr', 'es'
    name TEXT NOT NULL                -- par exemple "Anglais", "Français"
);

-- 1.2. Table des Utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    pseudo TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    language_id INTEGER REFERENCES languages(id),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3. Table des Titres Spéciaux (ex. "Diligent", "Ouroboros")
CREATE TABLE special_titles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT
);

-- 1.3.1. Attribution des Titres Spéciaux aux Utilisateurs
CREATE TABLE user_special_titles_assignment (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    special_title_id INTEGER NOT NULL REFERENCES special_titles(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, special_title_id)
);

-- 1.4. Table des Badges
CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

-- 1.4.1. Attribution des Badges aux Utilisateurs
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- 1.5. Table des Questions (pour divers types de quiz)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,    -- libellé de la question dans la langue de base
    type VARCHAR(20) NOT NULL CHECK (type IN ('multiple_choice', 'text', 'image', 'map', 'geoguessr')),
    image_url TEXT,                 -- URL de l’image si nécessaire
    map_data JSONB,                 -- données de géolocalisation (par exemple, coordonnées, polygone)
    choices TEXT[],                 -- liste des options pour QCM
    correct_answers TEXT[] NOT NULL,  -- liste des réponses acceptées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.6. Table des Quiz (groupes de questions)
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),  -- créateur (ou admin) du quiz
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.7. Table de liaison Quiz-Questions (pour définir l’ordre des questions)
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER DEFAULT 0,
    UNIQUE(quiz_id, question_id)
);

-- 1.8. Table des Tentatives de Quiz
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,               -- par exemple, nombre d'étoiles (1 à 5)
    xp_earned INTEGER DEFAULT 0
);

-- 1.9. Table des Réponses lors d'une Tentative de Quiz
CREATE TABLE quiz_attempt_answers (
    id SERIAL PRIMARY KEY,
    quiz_attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,            -- réponse saisie par l’utilisateur
    correct BOOLEAN,             -- indique si la réponse est correcte
    time_taken INTEGER,          -- temps de réponse en secondes
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.10. Table des Duels (1v1 ou duels thématiques)
CREATE TABLE duels (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id),  -- optionnel, si le duel se base sur un quiz
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    user1_score INTEGER DEFAULT 0,
    user2_score INTEGER DEFAULT 0,
    winner_id INTEGER REFERENCES users(id)   -- gagnant du duel
);

-- 1.10.1. Détail des Réponses dans un Duel
CREATE TABLE duel_attempt_answers (
    id SERIAL PRIMARY KEY,
    duel_id INTEGER NOT NULL REFERENCES duels(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user1_answer TEXT,
    user2_answer TEXT,
    user1_time_taken INTEGER,
    user2_time_taken INTEGER,
    user1_correct BOOLEAN,
    user2_correct BOOLEAN
);

-- 1.11. Table des Clans (pour les combats clans contre clans)
CREATE TABLE clans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.11.1. Appartenance des Utilisateurs aux Clans
CREATE TABLE user_clans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clan_id INTEGER NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',  -- par exemple 'member', 'admin'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, clan_id)
);

-- 1.12. Table des Quêtes (objectifs quotidiens et bonus XP)
CREATE TABLE quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_type TEXT,               -- par exemple 'daily', 'seasonal'
    description TEXT,
    xp_reward INTEGER,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'expired'
    start_date DATE,
    end_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 1.13. Table des Abonnements (pour le mode premium)
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL,  -- par exemple 'premium'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE
);

-- 1.14. Table des Évaluations de Quiz (notation par étoiles)
CREATE TABLE quiz_ratings (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, user_id)
);

-- 1.15. Table des Notifications (pour informer les utilisateurs)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.16. (Optionnel) Table des Logs de Traductions
CREATE TABLE translation_logs (
    id SERIAL PRIMARY KEY,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language VARCHAR(5),
    target_language VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. Tables pour les données géographiques essentielles (GeoNames)
-- ============================================================

-- 2.1. Table des Pays (informations essentielles importées de GeoNames)
CREATE TABLE countries (
    geonameid INTEGER PRIMARY KEY,         -- identifiant unique fourni par GeoNames
    country_code VARCHAR(2) NOT NULL,       -- ex: 'FR', 'US'
    name TEXT NOT NULL,                     -- nom du pays
    capital TEXT,                           -- capitale (si disponible)
    population BIGINT,                      -- population
    latitude NUMERIC(10,6),                 -- latitude
    longitude NUMERIC(10,6),                -- longitude
    continent TEXT,                         -- par exemple 'EU', 'NA'
    timezone TEXT,                          -- fuseau horaire
    modification_date DATE                  -- date de dernière modification des données
);

-- 2.2. Table des Villes Principales (optionnelle, pour stocker les grandes villes)
CREATE TABLE cities (
    geonameid INTEGER PRIMARY KEY,         -- identifiant GeoNames
    name TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL,       -- référence au pays (peut être joint avec countries)
    admin1 TEXT,                            -- première subdivision (état, région, etc.)
    population BIGINT,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    timezone TEXT,
    modification_date DATE
);
