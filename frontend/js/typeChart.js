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

const typeColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC'
};

const typeIcons = {
    normal: 'circle',
    fire: 'flame',
    water: 'droplets',
    electric: 'zap',
    grass: 'leaf',
    ice: 'snowflake',
    fighting: 'swords',
    poison: 'skull',
    ground: 'mountain',
    flying: 'wind',
    psychic: 'brain',
    bug: 'bug',
    rock: 'gem',
    ghost: 'ghost',
    dragon: 'shield-alert',
    dark: 'moon',
    steel: 'shield',
    fairy: 'sparkles'
};

export { typeChart, typeColors, typeIcons };
