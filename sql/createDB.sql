CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'admin', 'moderator')) DEFAULT 'user',
    experience INT DEFAULT 0,
    level INT DEFAULT 1,
    status VARCHAR(20) CHECK (status IN ('active', 'banned', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50),
    badges TEXT[],
    language_preference VARCHAR(10) DEFAULT 'fr'
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL
);

CREATE TABLE languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE country_languages (
    country_id INT REFERENCES countries(id) ON DELETE CASCADE,
    language_code VARCHAR(10) REFERENCES languages(code) ON DELETE CASCADE,
    PRIMARY KEY (country_id, language_code)
);

CREATE TABLE landmarks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INT REFERENCES countries(id) ON DELETE CASCADE,
    latitude DECIMAL,
    longitude DECIMAL,
    image_url TEXT
);

CREATE TABLE geo_challenges (
    id SERIAL PRIMARY KEY,
    landmark_id INT REFERENCES landmarks(id) ON DELETE CASCADE,
    challenge_text TEXT NOT NULL
);

CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    media_url TEXT,
    question_type VARCHAR(50) CHECK (question_type IN ('multiple_choice', 'text', 'map_click')) NOT NULL
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE duels (
    id SERIAL PRIMARY KEY,
    player1_id INT REFERENCES users(id) ON DELETE CASCADE,
    player2_id INT REFERENCES users(id) ON DELETE CASCADE,
    winner_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE duel_rounds (
    id SERIAL PRIMARY KEY,
    duel_id INT REFERENCES duels(id) ON DELETE CASCADE,
    question_id INT REFERENCES questions(id) ON DELETE CASCADE,
    player1_answer TEXT,
    player2_answer TEXT,
    correct_answer TEXT
);

CREATE TABLE rankings (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    global_rank INT,
    regional_rank INT
);

CREATE TABLE leaderboard_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    rank INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reported_by INT REFERENCES users(id) ON DELETE CASCADE,
    reported_user INT REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patreon_supporters (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50),
    benefits TEXT
);

CREATE TABLE security (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_quizzes_title ON quizzes(title);
CREATE INDEX idx_questions_quiz ON questions(quiz_id);

-- Table des continents
CREATE TABLE continents (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Table des devises (monnaies)
CREATE TABLE currencies (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    symbol VARCHAR(10)
);

-- Table des langues disponibles pour l'application
CREATE TABLE app_languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Modification de la table countries pour inclure un lien avec les continents et les devises
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    continent_code VARCHAR(10) REFERENCES continents(code) ON DELETE SET NULL,
    capital VARCHAR(100),
    currency_code VARCHAR(10) REFERENCES currencies(code) ON DELETE SET NULL,
    latitude DECIMAL,
    longitude DECIMAL
);

-- Table des traductions (pour stocker des textes multilingues)
CREATE TABLE translations (
    key VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) REFERENCES app_languages(code) ON DELETE CASCADE,
    value TEXT NOT NULL,
    PRIMARY KEY (key, language_code)
);

-- Table pour associer les utilisateurs aux rôles
CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Table pour gérer les badges de manière plus flexible
CREATE TABLE user_badges (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    badge_name VARCHAR(100),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_name)
);

-- Ajout d'un champ icon_url pour stocker des icônes de badges et d'achievements
ALTER TABLE achievements ADD COLUMN icon_url TEXT;
ALTER TABLE user_badges ADD COLUMN icon_url TEXT;

-- Table pour stocker les tokens de réinitialisation de mot de passe
CREATE TABLE password_resets (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, token)
);
