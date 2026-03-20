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

const VERSION_COLORS = { 
  red:      'bg-red-500/15 text-red-600', 
  blue:     'bg-blue-500/15 text-blue-600', 
  yellow:   'bg-yellow-500/15 text-yellow-700', 
  gold:     'bg-amber-500/15 text-amber-700', 
  silver:   'bg-gray-400/15 text-gray-500', 
  crystal:  'bg-cyan-400/15 text-cyan-600', 
  ruby:     'bg-red-600/15 text-red-600', 
  sapphire: 'bg-blue-600/15 text-blue-600', 
  emerald:  'bg-emerald-500/15 text-emerald-600', 
  diamond:  'bg-blue-300/15 text-blue-400', 
  pearl:    'bg-pink-300/15 text-pink-400', 
  platinum: 'bg-gray-500/15 text-gray-500', 
  black:    'bg-gray-800/15 text-gray-700', 
  white:    'bg-gray-200/30 text-gray-500', 
  x:        'bg-blue-500/15 text-blue-600', 
  y:        'bg-red-400/15 text-red-500', 
  sun:      'bg-orange-400/15 text-orange-500', 
  moon:     'bg-indigo-400/15 text-indigo-500', 
  sword:    'bg-cyan-500/15 text-cyan-600', 
  shield:   'bg-red-500/15 text-red-500' 
};

const GEN_LABELS = { 
  'generation-i': 'Gen I',     'generation-ii': 'Gen II', 
  'generation-iii': 'Gen III', 'generation-iv': 'Gen IV', 
  'generation-v': 'Gen V',    'generation-vi': 'Gen VI', 
  'generation-vii': 'Gen VII','generation-viii': 'Gen VIII', 
  'generation-ix': 'Gen IX' 
};

const METHOD_LABELS = { 
  'level-up': 'Level Up', 
  'machine': 'TM/HM', 
  'tutor': 'Tutor', 
  'egg': 'Egg' 
};

const DAMAGE_CLASS_STYLES = { 
  physical: 'bg-red-500/15 text-red-600 dark:text-red-400', 
  special:  'bg-blue-500/15 text-blue-600 dark:text-blue-400', 
  status:   'bg-gray-300/30 text-gray-500 dark:text-gray-400' 
};

let audio = null;
let movesExpanded = false; 
let currentFilter = 'all'; 
let allMoves = []; 
let totalMovesCount = 0; 

/**
 * Busca detalhes de uma habilidade
 */
async function fetchAbilityDetail(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    const effectEntry = data.effect_entries.find(e => e.language.name === 'en');
    const flavorEntry = data.flavor_text_entries.find(e => e.language.name === 'en');

    return {
      name: data.name,
      description: effectEntry?.short_effect || flavorEntry?.flavor_text || 'No description available.'
    };
  } catch (error) {
    console.error('Error fetching ability detail:', error);
    return { name: 'Unknown', description: 'Description unavailable.' };
  }
}

/**
 * Renderiza habilidades detalhadas
 */
async function renderAbilities(abilities) {
  const container = document.querySelector('.abilities-detailed');
  if (!container) return;
  
  container.innerHTML = '<div class="flex justify-center p-4"><div class="w-6 h-6 border-2 border-coral/20 border-t-coral rounded-full animate-spin"></div></div>';

  const abilitiesHtml = await Promise.all(
    abilities.map(async (a, i) => {
      // a.name is the ability name from our backend/cache
      // We need to fetch the full details from PokeAPI using its name/ID
      const detail = await fetchAbilityDetail(`https://pokeapi.co/api/v2/ability/${a}`);

      return `
        <div class="rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 p-4 
                    border border-gray-200/50 dark:border-gray-700/50 
                    opacity-0 animate-fade-slide-up" 
             style="animation-delay: ${0.4 + i * 0.1}s"> 
          <div class="flex items-center gap-2 mb-1.5"> 
            <span class="font-display font-bold text-gray-800 dark:text-gray-200 capitalize"> 
              ${a.replace(/-/g, ' ')} 
            </span> 
          </div> 
          <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"> 
            ${detail.description} 
          </p> 
        </div>`;
    })
  );

  container.innerHTML = abilitiesHtml.join('');
}

/**
 * Busca a cadeia de evolução
 */
async function fetchEvolutionChain(pokemonId) {
  try {
    // 1. Buscar species para pegar URL da cadeia
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const speciesData = await speciesRes.json();

    // 2. Buscar cadeia de evolução
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    // 3. Extrair estágios recursivamente
    const stages = [];

    function extractId(url) {
      const parts = url.replace(/\/$/, '').split('/');
      return parseInt(parts[parts.length - 1]);
    }

    function walk(chain) {
      const speciesId = extractId(chain.species.url);
      const details = chain.evolution_details?.[0];

      stages.push({
        id: speciesId,
        name: chain.species.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${speciesId}.png`,
        minLevel: details?.min_level || null,
        trigger: details?.trigger?.name || null,
        item: details?.item?.name || details?.held_item?.name || null
      });

      if (chain.evolves_to && chain.evolves_to.length > 0) {
        chain.evolves_to.forEach(walk);
      }
    }

    walk(evoData.chain);
    return stages;
  } catch (error) {
    console.error('Error fetching evolution chain:', error);
    return [];
  }
}

/**
 * Renderiza a cadeia de evolução
 */
async function renderEvolutionChain(pokemonId) {
  const container = document.querySelector('.evolution-chain');
  if (!container) return;

  container.innerHTML = '<div class="w-8 h-8 border-4 border-coral/20 border-t-coral rounded-full animate-spin"></div>';

  const stages = await fetchEvolutionChain(pokemonId);

  if (stages.length <= 1) {
    container.innerHTML = `
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4"> 
        This Pokémon does not evolve. 
      </p>`;
    return;
  }

  container.innerHTML = stages.map((stage, i) => {
    const isCurrent = stage.id === pokemonId;
    const nextStage = stages[i + 1];

    const stageHtml = `
      <a href="details.html?id=${stage.id}" 
         class="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors 
                ${isCurrent 
                  ? 'bg-coral/10 ring-2 ring-coral/30' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'} 
                opacity-0 animate-fade-slide-up" 
         style="animation-delay: ${0.7 + i * 0.15}s"> 
        <div class="h-20 w-20 rounded-full flex items-center justify-center 
                    ${isCurrent ? 'bg-coral/5' : 'bg-gray-100/50 dark:bg-gray-800/50'}"> 
          <img src="${stage.image}" alt="${stage.name}" 
               class="h-16 w-16 object-contain drop-shadow-md"> 
        </div> 
        <span class="font-display font-bold text-xs capitalize text-gray-800 dark:text-gray-200"> 
          ${stage.name} 
        </span> 
        <span class="text-[10px] text-gray-400 dark:text-gray-500"> 
          #${String(stage.id).padStart(3, '0')} 
        </span> 
      </a>`;

    const arrowHtml = (i < stages.length - 1) ? ` 
      <div class="flex flex-col items-center gap-0.5 px-1"> 
        <span class="text-gray-400 dark:text-gray-500">→</span> 
        ${nextStage?.minLevel ? ` 
          <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium"> 
            Lv.${nextStage.minLevel} 
          </span>` : ''} 
        ${nextStage?.item ? ` 
          <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium capitalize"> 
            ${nextStage.item.replace(/-/g, ' ')} 
          </span>` : ''} 
      </div>` : '';

    return stageHtml + arrowHtml;
  }).join('');
}

/**
 * Busca movimentos do Pokémon
 */
async function fetchMoves(pokemonId) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await res.json();

    const movesRaw = data.moves.map(m => {
      const latest = m.version_group_details[m.version_group_details.length - 1];
      return {
        name: m.move.name,
        url: m.move.url,
        level: latest?.level_learned_at || 0,
        method: latest?.move_learn_method.name || 'unknown'
      };
    }).sort((a, b) => a.level - b.level);

    const detailed = await Promise.all(
      movesRaw.slice(0, 30).map(async (m) => {
        try {
          const moveRes = await fetch(m.url);
          const moveData = await moveRes.json();
          return {
            name: m.name,
            level: m.level,
            method: m.method,
            type: moveData.type?.name || null,
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            damageClass: moveData.damage_class?.name
          };
        } catch {
          return { name: m.name, level: m.level, method: m.method, type: null, power: null, accuracy: null, pp: null, damageClass: null };
        }
      })
    );

    return { detailed, totalCount: movesRaw.length };
  } catch (error) {
    console.error('Error fetching moves:', error);
    return { detailed: [], totalCount: 0 };
  }
}

/**
 * Renderiza a seção de movimentos
 */
async function renderMoves(pokemonId) {
  const container = document.querySelector('.moves-table-body');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="w-6 h-6 border-2 border-coral/20 border-t-coral rounded-full animate-spin mx-auto"></div></td></tr>';

  const { detailed, totalCount } = await fetchMoves(pokemonId);
  allMoves = detailed;
  totalMovesCount = totalCount;

  document.querySelector('.moves-count').textContent = `${totalCount} moves`;

  const methods = [...new Set(detailed.map(m => m.method))];
  renderMoveFilters(methods);
  renderMoveTable();
}

/**
 * Renderiza os filtros de movimentos
 */
function renderMoveFilters(methods) {
  const container = document.querySelector('.moves-filters');
  if (!container) return;

  window.setMoveFilter = (filter) => {
    currentFilter = filter;
    movesExpanded = false;
    renderMoveFilters(methods);
    renderMoveTable();
  };

  const allBtn = `
    <button onclick="setMoveFilter('all')" 
            class="move-filter-btn px-3 py-1 rounded-full text-xs font-medium transition-colors 
                   ${currentFilter === 'all' ? 'bg-coral text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
      All
    </button>`;

  const methodBtns = methods.map(m => `
    <button onclick="setMoveFilter('${m}')" 
            class="move-filter-btn px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors 
                   ${currentFilter === m ? 'bg-coral text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}">
      ${METHOD_LABELS[m] || m}
    </button>`).join('');

  container.innerHTML = allBtn + methodBtns;
}

/**
 * Renderiza a tabela de movimentos
 */
function renderMoveTable() {
  const filtered = currentFilter === 'all' 
    ? allMoves 
    : allMoves.filter(m => m.method === currentFilter);

  const displayed = movesExpanded ? filtered : filtered.slice(0, 10);

  const tbody = document.querySelector('.moves-table-body');
  if (!tbody) return;

  tbody.innerHTML = displayed.map((m, i) => `
    <tr class="border-b border-gray-200/50 dark:border-gray-700/50 last:border-0 
               opacity-0 animate-fade-slide-up" 
        style="animation-delay: ${i * 0.02}s"> 
      <td class="py-2 font-medium capitalize text-gray-800 dark:text-gray-200"> 
        ${m.name.replace(/-/g, ' ')} 
        ${m.level > 0 ? `<span class="text-xs text-gray-400 ml-1">Lv.${m.level}</span>` : ''} 
      </td> 
      <td class="py-2"> 
        ${m.type ? `<span class="type-badge type-${m.type}">${m.type}</span>` : ''} 
      </td> 
      <td class="py-2 text-center font-display font-bold text-gray-800 dark:text-gray-200"> 
        ${m.power ?? '—'} 
      </td> 
      <td class="py-2 text-center text-gray-500 dark:text-gray-400"> 
        ${m.accuracy ? m.accuracy + '%' : '—'} 
      </td> 
      <td class="py-2 text-center text-gray-500 dark:text-gray-400"> 
        ${m.pp ?? '—'} 
      </td> 
      <td class="py-2"> 
        ${m.damageClass ? ` 
          <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize 
                       ${DAMAGE_CLASS_STYLES[m.damageClass] || 'bg-gray-200 text-gray-500'}"> 
            ${m.damageClass} 
          </span>` : ''} 
      </td> 
    </tr> 
  `).join('');

  const expandContainer = document.querySelector('.moves-expand-container');
  if (filtered.length > 10) {
    expandContainer.classList.remove('hidden');
    const btn = document.querySelector('.moves-expand-btn');
    btn.textContent = movesExpanded 
      ? 'Show Less ▲' 
      : `Show All ${filtered.length} Moves ▼`; 
    btn.onclick = () => { 
      movesExpanded = !movesExpanded; 
      renderMoveTable(); 
    }; 
  } else {
    expandContainer.classList.add('hidden');
  }
}

/**
 * Busca as versões do jogo em que o Pokémon aparece
 */
async function fetchGameVersions(pokemonId) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await res.json();

    const versions = await Promise.all(
      data.game_indices.map(async (gi) => {
        try {
          const vRes = await fetch(gi.version.url);
          const vData = await vRes.json();
          return {
            name: gi.version.name,
            generation: vData.version_group?.generation?.name || 'unknown'
          };
        } catch {
          return { name: gi.version.name, generation: 'unknown' };
        }
      })
    );

    return versions;
  } catch (error) {
    console.error('Error fetching game versions:', error);
    return [];
  }
}

/**
 * Renderiza as versões do jogo
 */
async function renderGameVersions(pokemonId) {
  const container = document.querySelector('.versions-container');
  if (!container) return;

  container.innerHTML = '<div class="flex justify-center p-4"><div class="w-6 h-6 border-2 border-coral/20 border-t-coral rounded-full animate-spin"></div></div>';

  const versions = await fetchGameVersions(pokemonId);

  document.querySelector('.versions-count').textContent = `${versions.length} games`;

  const grouped = {};
  versions.forEach(v => {
    const gen = GEN_LABELS[v.generation] || v.generation;
    if (!grouped[gen]) grouped[gen] = [];
    grouped[gen].push(v);
  });

  container.innerHTML = Object.entries(grouped).map(([gen, vList], gi) => ` 
    <div class="opacity-0 animate-fade-slide-up" style="animation-delay: ${0.8 + gi * 0.05}s"> 
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">${gen}</p> 
      <div class="flex flex-wrap gap-1.5"> 
        ${vList.map(v => ` 
          <span class="px-3 py-1 rounded-full text-xs font-medium capitalize 
                       ${VERSION_COLORS[v.name] || 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}"> 
            ${v.name} 
          </span>`).join('')} 
      </div> 
    </div>` 
  ).join('');
}

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

    // Abilities (Detailed)
    renderAbilities(pokemon.abilities);

    // Evolution Chain
    renderEvolutionChain(pokemon.id);

    // Moves
    renderMoves(pokemon.id);

    // Game Versions
    renderGameVersions(pokemon.id);

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
