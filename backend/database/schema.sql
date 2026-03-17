-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS pokedex_db;
USE pokedex_db;

-- TABELA: users
-- FINALIDADE: Armazenar informações de usuários registrados no sistema
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Criptografado com bcrypt
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABELA: pokemons
-- FINALIDADE: Cache local de Pokémon consultados na PokéAPI
CREATE TABLE IF NOT EXISTS pokemons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pokemon_id INT UNIQUE NOT NULL, -- ID da PokéAPI
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    base_experience INT,
    image_url VARCHAR(255),
    front_default_url VARCHAR(255),
    back_default_url VARCHAR(255),
    stats_hp INT,
    stats_attack INT,
    stats_defense INT,
    stats_sp_attack INT,
    stats_sp_defense INT,
    stats_speed INT,
    abilities JSON,
    types_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABELA: favorites
-- FINALIDADE: Armazenar Pokémon favoritados por cada usuário
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pokemon_id), -- Evita duplicatas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE
);

-- TABELA: teams
-- FINALIDADE: Armazenar times de Pokémon criados pelos usuários
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    slot_1 INT,
    slot_2 INT,
    slot_3 INT,
    slot_4 INT,
    slot_5 INT,
    slot_6 INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_1) REFERENCES pokemons(id) ON DELETE SET NULL,
    FOREIGN KEY (slot_2) REFERENCES pokemons(id) ON DELETE SET NULL,
    FOREIGN KEY (slot_3) REFERENCES pokemons(id) ON DELETE SET NULL,
    FOREIGN KEY (slot_4) REFERENCES pokemons(id) ON DELETE SET NULL,
    FOREIGN KEY (slot_5) REFERENCES pokemons(id) ON DELETE SET NULL,
    FOREIGN KEY (slot_6) REFERENCES pokemons(id) ON DELETE SET NULL
);

-- TABELA: view_history
-- FINALIDADE: Rastrear Pokémon visualizados por cada usuário
CREATE TABLE IF NOT EXISTS view_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pokemon_id) REFERENCES pokemons(id) ON DELETE CASCADE
);