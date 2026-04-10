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
    height DECIMAL(10,2),
    weight DECIMAL(10,2),
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
    flavor_text TEXT,
    varieties_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABELA: favorites
-- FINALIDADE: Armazenar Pokémon favoritados por cada usuário
CREATE TABLE IF NOT EXISTS favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    pokemon_id INT NOT NULL, -- Agora armazena diretamente o ID da PokéAPI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pokemon_id), -- Evita duplicatas
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    -- Sem FK para pokemons.id para permitir favoritar antes mesmo do cache estar completo
);

-- TABELA: teams
-- FINALIDADE: Armazenar times de Pokémon criados pelos usuários
CREATE TABLE IF NOT EXISTS teams ( 
   id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()), 
   user_id INT NOT NULL, 
   name VARCHAR(30) NOT NULL, 
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
); 

-- TABELA: team_slots
-- FINALIDADE: Armazenar os Pokémon que compõem cada time (máx 6)
CREATE TABLE IF NOT EXISTS team_slots ( 
   id INT AUTO_INCREMENT PRIMARY KEY, 
   team_id VARCHAR(36) NOT NULL, 
   slot_index TINYINT NOT NULL CHECK (slot_index BETWEEN 0 AND 5), 
   pokemon_id INT NOT NULL, 
   pokemon_name VARCHAR(50) NOT NULL, 
   pokemon_image VARCHAR(255) NOT NULL, 
   FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE, 
   UNIQUE (team_id, slot_index) 
); 

-- TABELA: team_slot_moves
-- FINALIDADE: Armazenar os movimentos de cada Pokémon no time
CREATE TABLE IF NOT EXISTS team_slot_moves (
   id INT AUTO_INCREMENT PRIMARY KEY,
   slot_id INT NOT NULL,
   move_name VARCHAR(100) NOT NULL,
   FOREIGN KEY (slot_id) REFERENCES team_slots(id) ON DELETE CASCADE
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

-- TABELA: pokemon_types
-- FINALIDADE: Armazenar informações sobre os tipos Pokémon (nome, cor, ícone)
CREATE TABLE IF NOT EXISTS pokemon_types ( 
   id INT AUTO_INCREMENT PRIMARY KEY, 
   name VARCHAR(50) UNIQUE NOT NULL, 
   color VARCHAR(20) NOT NULL, 
   icon_path VARCHAR(255) NOT NULL, 
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
); 
