import api from './api.js';

const STAT_LABELS = {
  "hp": "HP",
  "attack": "Attack",
  "defense": "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  "speed": "Speed"
};

const ICONS = {
  'HP': '❤️',
  'Attack': '⚔️',
  'Defense': '🛡️',
  'Sp. Atk': '⚡',
  'Sp. Def': '🛡️',
  'Speed': '⭐'
};

let audio = null;

/**
 * Toca o áudio do Pokémon com feedback visual
 */
function playCry(url) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  
  const btn = document.querySelector('.cry-text');
  const icon = document.querySelector('.cry-icon');
  
  audio = new Audio(url);
  btn.textContent = 'Playing...';
  icon.textContent = '🔇';
  
  audio.play().catch(() => {
    btn.textContent = 'Play Cry';
    icon.textContent = '🔊';
  });
  
  audio.onended = () => {
    btn.textContent = 'Play Cry';
    icon.textContent = '🔊';
  };
  
  audio.onerror = () => {
    btn.textContent = 'Play Cry';
    icon.textContent = '🔊';
  };
}

/**
 * Renderiza as estatísticas com destaque de cores
 */
function renderStats(stats) {
  const maxVal = Math.max(...stats.map(s => s.value));
  const minVal = Math.min(...stats.map(s => s.value));
  
  const statsContainer = document.querySelector('.stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = stats.map((s, i) => {
    const pct = Math.min((s.value / 255) * 100, 100);
    let barColor = 'bg-coral';
    let textColor = '';
    
    // Destaque para maior e menor valor
    if (s.value === maxVal) {
      barColor = 'bg-stat-green';
      textColor = 'text-stat-green';
    } else if (s.value === minVal) {
      barColor = 'bg-stat-red';
      textColor = 'text-stat-red';
    }

    return `
      <div class="flex items-center gap-3" 
           style="opacity:0; animation: fadeSlideUp 0.5s ease-out ${0.5 + i * 0.05}s forwards">
        <span class="w-5 text-center text-gray-400">${ICONS[s.label] || '⚡'}</span>
        <span class="w-16 text-xs font-medium text-gray-500 uppercase tracking-wide">${s.label}</span>
        <span class="w-10 text-sm font-bold font-display text-right ${textColor}">${s.value}</span>
        <div class="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div class="${barColor} h-full rounded-full" 
               style="width:0%; animation: fillBar 0.8s ease-out ${0.5 + i * 0.05}s forwards; --fill-width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');

  document.querySelector('.stat-total').textContent = stats.reduce((a, s) => a + s.value, 0);
}

/**
 * Inicializa a página de detalhes
 */
async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    const response = await api.get(`/pokemon/${id}`);
    if (!response.success) throw new Error(response.message);

    const data = response.data;
    
    // Mapeamento dos dados
    const pokemon = {
      id: data.id,
      name: data.name,
      image_url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`,
      types: data.types || [],
      height: data.height,
      weight: data.weight,
      abilities: data.abilities || [],
      stats: data.stats.map(s => ({ 
        label: STAT_LABELS[s.name] || s.name, 
        value: s.value 
      })),
      cry_url: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${data.id}.ogg`
    };

    // Atualizar UI
    document.title = `Pokédex - ${pokemon.name.toUpperCase()}`;
    document.querySelector('.pokemon-number').textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    document.querySelector('.pokemon-name').textContent = pokemon.name;
    document.querySelector('.pokemon-title').textContent = pokemon.name;
    document.querySelector('.pokemon-image').src = pokemon.image_url;
    document.querySelector('.pokemon-image').alt = pokemon.name;
    
    // Types
    document.querySelector('.types').innerHTML = pokemon.types.map(type => `
      <span class="type-pill bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm border border-black/5">
        ${type}
      </span>
    `).join('');

    // Physical
    document.querySelector('.height-value').textContent = `${pokemon.height / 10} m`;
    document.querySelector('.weight-value').textContent = `${pokemon.weight / 10} kg`;

    // Abilities
    document.querySelector('.abilities').innerHTML = pokemon.abilities.map(ability => `
      <span class="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 capitalize border border-black/5">
        ${ability}
      </span>
    `).join('');

    // Stats
    renderStats(pokemon.stats);

    // Cry button
    const cryBtn = document.querySelector('.cry-btn');
    cryBtn.addEventListener('click', () => playCry(pokemon.cry_url));

  } catch (error) {
    console.error('Erro ao carregar detalhes:', error);
    alert('Erro ao carregar detalhes do Pokémon.');
    window.location.href = 'dashboard.html';
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
