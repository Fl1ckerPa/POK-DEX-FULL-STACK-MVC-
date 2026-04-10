/**
 * Mapeamento estático de relações de dano entre tipos Pokémon.
 * Este arquivo mantém as regras de eficácia (typeChart) constantes,
 * enquanto as cores e ícones podem ser carregados dinamicamente do banco de dados.
 */

const typeChart = {
    normal: {
        double_damage_from: ['fighting'],
        half_damage_from: [],
        no_damage_from: ['ghost'],
        double_damage_to: [],
        half_damage_to: ['rock', 'steel'],
        no_damage_to: ['ghost']
    },
    fire: {
        double_damage_from: ['water', 'ground', 'rock'],
        half_damage_from: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
        no_damage_from: [],
        double_damage_to: ['grass', 'ice', 'bug', 'steel'],
        half_damage_to: ['fire', 'water', 'rock', 'dragon'],
        no_damage_to: []
    },
    water: {
        double_damage_from: ['electric', 'grass'],
        half_damage_from: ['fire', 'water', 'ice', 'steel'],
        no_damage_from: [],
        double_damage_to: ['fire', 'ground', 'rock'],
        half_damage_to: ['water', 'grass', 'dragon'],
        no_damage_to: []
    },
    electric: {
        double_damage_from: ['ground'],
        half_damage_from: ['electric', 'flying', 'steel'],
        no_damage_from: [],
        double_damage_to: ['water', 'flying'],
        half_damage_to: ['electric', 'grass', 'dragon'],
        no_damage_to: ['ground']
    },
    grass: {
        double_damage_from: ['fire', 'ice', 'poison', 'flying', 'bug'],
        half_damage_from: ['water', 'electric', 'grass', 'ground'],
        no_damage_from: [],
        double_damage_to: ['water', 'ground', 'rock'],
        half_damage_to: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
        no_damage_to: []
    },
    ice: {
        double_damage_from: ['fire', 'fighting', 'rock', 'steel'],
        half_damage_from: ['ice'],
        no_damage_from: [],
        double_damage_to: ['grass', 'ground', 'flying', 'dragon'],
        half_damage_to: ['fire', 'water', 'ice', 'steel'],
        no_damage_to: []
    },
    fighting: {
        double_damage_from: ['flying', 'psychic', 'fairy'],
        half_damage_from: ['bug', 'rock', 'dark'],
        no_damage_from: [],
        double_damage_to: ['normal', 'ice', 'rock', 'dark', 'steel'],
        half_damage_to: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
        no_damage_to: ['ghost']
    },
    poison: {
        double_damage_from: ['ground', 'psychic'],
        half_damage_from: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
        no_damage_from: [],
        double_damage_to: ['grass', 'fairy'],
        half_damage_to: ['poison', 'ground', 'rock', 'ghost'],
        no_damage_to: ['steel']
    },
    ground: {
        double_damage_from: ['water', 'grass', 'ice'],
        half_damage_from: ['poison', 'rock'],
        no_damage_from: ['electric'],
        double_damage_to: ['fire', 'electric', 'poison', 'rock', 'steel'],
        half_damage_to: ['grass', 'bug'],
        no_damage_to: ['flying']
    },
    flying: {
        double_damage_from: ['electric', 'ice', 'rock'],
        half_damage_from: ['grass', 'fighting', 'bug'],
        no_damage_from: ['ground'],
        double_damage_to: ['grass', 'fighting', 'bug'],
        half_damage_to: ['electric', 'rock', 'steel'],
        no_damage_to: []
    },
    psychic: {
        double_damage_from: ['bug', 'ghost', 'dark'],
        half_damage_from: ['fighting', 'psychic'],
        no_damage_from: [],
        double_damage_to: ['fighting', 'poison'],
        half_damage_to: ['psychic', 'steel'],
        no_damage_to: ['dark']
    },
    bug: {
        double_damage_from: ['fire', 'flying', 'rock'],
        half_damage_from: ['grass', 'fighting', 'ground'],
        no_damage_from: [],
        double_damage_to: ['grass', 'psychic', 'dark'],
        half_damage_to: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
        no_damage_to: []
    },
    rock: {
        double_damage_from: ['water', 'grass', 'fighting', 'ground', 'steel'],
        half_damage_from: ['normal', 'fire', 'poison', 'flying'],
        no_damage_from: [],
        double_damage_to: ['fire', 'ice', 'flying', 'bug'],
        half_damage_to: ['fighting', 'ground', 'steel'],
        no_damage_to: []
    },
    ghost: {
        double_damage_from: ['ghost', 'dark'],
        half_damage_from: ['poison', 'bug'],
        no_damage_from: ['normal', 'fighting'],
        double_damage_to: ['psychic', 'ghost'],
        half_damage_to: ['dark'],
        no_damage_to: ['normal']
    },
    dragon: {
        double_damage_from: ['ice', 'dragon', 'fairy'],
        half_damage_from: ['fire', 'water', 'electric', 'grass'],
        no_damage_from: [],
        double_damage_to: ['dragon'],
        half_damage_to: ['steel'],
        no_damage_to: ['fairy']
    },
    dark: {
        double_damage_from: ['fighting', 'bug', 'fairy'],
        half_damage_from: ['ghost', 'dark'],
        no_damage_from: ['psychic'],
        double_damage_to: ['psychic', 'ghost'],
        half_damage_to: ['fighting', 'dark', 'fairy'],
        no_damage_to: []
    },
    steel: {
        double_damage_from: ['fire', 'fighting', 'ground'],
        half_damage_from: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
        no_damage_from: ['poison'],
        double_damage_to: ['ice', 'rock', 'fairy'],
        half_damage_to: ['fire', 'water', 'electric', 'steel'],
        no_damage_to: []
    },
    fairy: {
        double_damage_from: ['poison', 'steel'],
        half_damage_from: ['fighting', 'bug', 'dark'],
        no_damage_from: ['dragon'],
        double_damage_to: ['fighting', 'dragon', 'dark'],
        half_damage_to: ['fire', 'poison', 'steel'],
        no_damage_to: []
    }
};

/**
 * Função utilitária para buscar tipos Pokémon da API e reconstruir os objetos typeColors e typeIcons.
 * @returns {Promise<{colors: Object, icons: Object}>}
 */
async function fetchTypeData() {
    // 1. Tentar carregar do Cache Local (LocalStorage) primeiro para velocidade instantânea
    const cached = localStorage.getItem('pokemon_types_cache');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            // Verificar se o cache é válido (ex: menos de 24h)
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                // Disparar atualização em background para manter o cache fresco
                updateCacheInBackground();
                return parsed.data;
            }
        } catch (e) {
            console.warn('Erro ao ler cache de tipos:', e);
        }
    }

    try {
        const response = await fetch('/api/types');
        const result = await response.json();
        
        if (!result.success) throw new Error(result.message);

        const colors = {};
        const icons = {};

        result.data.forEach(type => {
            colors[type.name] = type.color;
            icons[type.name] = type.icon;
        });

        const data = { colors, icons };
        
        // 2. Salvar no Cache Local
        localStorage.setItem('pokemon_types_cache', JSON.stringify({
            timestamp: Date.now(),
            data: data
        }));

        return data;
    } catch (error) {
        console.error('Falha ao carregar dados dos tipos da API:', error.message);
        // Fallback para valores locais se a API e o Cache falharem
        return {
            colors: {
                normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
                grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
                ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
                rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
                steel: '#B8B8D0', fairy: '#EE99AC'
            },
            icons: {
                fire: '../assets/icons/types/fire.png', water: '../assets/icons/types/water.png',
                grass: '../assets/icons/types/grass.png', electric: '../assets/icons/types/electric.png',
                psychic: '../assets/icons/types/psychic.png', ice: '../assets/icons/types/ice.png',
                dragon: '../assets/icons/types/dragon.png', dark: '../assets/icons/types/dark.png',
                fairy: '../assets/icons/types/fairy.png', fighting: '../assets/icons/types/fighting.png',
                flying: '../assets/icons/types/flying.png', poison: '../assets/icons/types/poison.png',
                ground: '../assets/icons/types/ground.png', rock: '../assets/icons/types/rock.png',
                bug: '../assets/icons/types/bug.png', ghost: '../assets/icons/types/ghost.png',
                steel: '../assets/icons/types/steel.png', normal: '../assets/icons/types/normal.png'
            }
        };
    }
}

/**
 * Atualiza o cache em background para garantir que o próximo carregamento esteja atualizado.
 */
async function updateCacheInBackground() {
    try {
        const response = await fetch('/api/types');
        const result = await response.json();
        if (result.success) {
            const colors = {};
            const icons = {};
            result.data.forEach(type => {
                colors[type.name] = type.color;
                icons[type.name] = type.icon;
            });
            localStorage.setItem('pokemon_types_cache', JSON.stringify({
                timestamp: Date.now(),
                data: { colors, icons }
            }));
        }
    } catch (e) {
        // Ignorar erros em background
    }
}

// Valores iniciais (serão sobrescritos dinamicamente se necessário)
const typeColors = {
    normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
    grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
    ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
    rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
    steel: '#B8B8D0', fairy: '#EE99AC'
};

const typeIcons = {
    fire: '../assets/icons/types/fire.png', water: '../assets/icons/types/water.png',
    grass: '../assets/icons/types/grass.png', electric: '../assets/icons/types/electric.png',
    psychic: '../assets/icons/types/psychic.png', ice: '../assets/icons/types/ice.png',
    dragon: '../assets/icons/types/dragon.png', dark: '../assets/icons/types/dark.png',
    fairy: '../assets/icons/types/fairy.png', fighting: '../assets/icons/types/fighting.png',
    flying: '../assets/icons/types/flying.png', poison: '../assets/icons/types/poison.png',
    ground: '../assets/icons/types/ground.png', rock: '../assets/icons/types/rock.png',
    bug: '../assets/icons/types/bug.png', ghost: '../assets/icons/types/ghost.png',
    steel: '../assets/icons/types/steel.png', normal: '../assets/icons/types/normal.png'
};

export { typeChart, typeColors, typeIcons, fetchTypeData };
