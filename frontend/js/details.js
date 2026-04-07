import api from './api.js';

const STAT_LABELS = {
  "hp": "HP",
  "attack": "Ataque",
  "defense": "Defesa",
  "special-attack": "Ataque Esp.",
  "special-defense": "Defesa Esp.",
  "speed": "Velocidade"
};

const ICONS = {
  'HP': 'heart',
  'Ataque': 'swords',
  'Defesa': 'shield',
  'Ataque Esp.': 'sparkles',
  'Defesa Esp.': 'shield-check',
  'Velocidade': 'zap'
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
  'level-up': 'Subir Nível', 
  'machine': 'TM/HM', 
  'tutor': 'Tutor', 
  'egg': 'Ovo' 
};

const DAMAGE_CLASS_STYLES = { 
  physical: 'bg-red-500/15 text-red-600', 
  special:  'bg-blue-500/15 text-blue-600', 
  status:   'bg-gray-300/30 text-gray-500' 
};

const DAMAGE_CLASS_LABELS = {
  physical: 'Físico',
  special: 'Especial',
  status: 'Status'
};

let audio = null;
let statsChart = null;
let movesExpanded = false; 
let currentFilter = 'all'; 
let allMoves = []; 
let totalMovesCount = 0; 

/**
 * Renderiza o gráfico de radar das estatísticas
 */
function renderRadarChart(stats) {
  const ctx = document.getElementById('stats-radar-chart');
  if (!ctx) return;

  if (statsChart) {
    statsChart.destroy();
  }

  const labels = stats.map(s => s.label);
  const values = stats.map(s => s.value);

  statsChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Base Stats',
        data: values,
        backgroundColor: 'rgba(255, 122, 122, 0.2)',
        borderColor: 'rgba(255, 122, 122, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 122, 122, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 122, 122, 1)'
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: { display: true },
          suggestedMin: 0,
          suggestedMax: 150,
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/**
 * Alterna entre visualização de barra e radar
 */
function setupStatsToggle(stats) {
  const barBtn = document.getElementById('stats-bar-btn');
  const radarBtn = document.getElementById('stats-radar-btn');
  const barView = document.getElementById('stats-bar-view');
  const radarView = document.getElementById('stats-radar-view');

  if (!barBtn || !radarBtn) return;

  barBtn.onclick = () => {
    barBtn.classList.add('bg-white', 'shadow-sm', 'text-coral');
    barBtn.classList.remove('text-gray-400');
    radarBtn.classList.remove('bg-white', 'shadow-sm', 'text-coral');
    radarBtn.classList.add('text-gray-400');
    
    barView.classList.remove('hidden');
    radarView.classList.add('hidden');
  };

  radarBtn.onclick = () => {
    radarBtn.classList.add('bg-white', 'shadow-sm', 'text-coral');
    radarBtn.classList.remove('text-gray-400');
    barBtn.classList.remove('bg-white', 'shadow-sm', 'text-coral');
    barBtn.classList.add('text-gray-400');
    
    radarView.classList.remove('hidden');
    barView.classList.add('hidden');
    
    renderRadarChart(stats);
  };
}

/**
 * Busca a cadeia de evolução com requisitos detalhados
 */
async function fetchEvolutionChain(pokemonId) {
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const speciesData = await speciesRes.json();
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    const stages = [];
    function walk(chain) {
      const id = parseInt(chain.species.url.split('/').filter(Boolean).pop());
      const details = chain.evolution_details?.[0];
      
      let condition = null;
      if (details) {
        if (details.min_level) condition = `Nível ${details.min_level}`;
        else if (details.item) condition = `Usar ${details.item.name.replace(/-/g, ' ')}`;
        else if (details.trigger?.name === 'trade') condition = `Troca`;
        else if (details.held_item) condition = `Segurando ${details.held_item.name.replace(/-/g, ' ')}`;
        else if (details.location) condition = `Em ${details.location.name.replace(/-/g, ' ')}`;
        else if (details.known_move) condition = `Conhecendo ${details.known_move.name.replace(/-/g, ' ')}`;
        else if (details.min_happiness) condition = `Felicidade`;
      }

      stages.push({
        id,
        name: chain.species.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        condition
      });

      if (chain.evolves_to && chain.evolves_to.length > 0) {
        chain.evolves_to.forEach(walk);
      }
    }

    walk(evoData.chain);
    return stages;
  } catch (error) {
    console.error('Erro ao buscar cadeia de evolução:', error);
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
    container.innerHTML = '<p class="text-sm text-gray-500 py-4">Este Pokémon não possui evoluções.</p>';
    return;
  }

  container.innerHTML = stages.map((stage, i) => {
    const isCurrent = stage.id === pokemonId;
    const arrow = i < stages.length - 1 ? `
      <div class="flex flex-col items-center gap-1 px-2">
        <span class="text-gray-300 text-xl">→</span>
        ${stages[i+1].condition ? `
          <span class="text-[10px] font-bold text-coral bg-coral/5 px-2 py-0.5 rounded-full whitespace-nowrap">
            ${stages[i+1].condition}
          </span>
        ` : ''}
      </div>
    ` : '';

    return `
      <div class="flex items-center">
        <a href="details.html?id=${stage.id}" 
           class="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:scale-105
                  ${isCurrent ? 'bg-coral/10 ring-2 ring-coral/30' : 'hover:bg-gray-100'}">
          <div class="h-16 w-16 flex items-center justify-center">
            <img src="${stage.image}" alt="${stage.name}" class="h-14 w-14 object-contain">
          </div>
          <span class="font-display font-bold text-[10px] capitalize text-gray-800">${stage.name}</span>
        </a>
        ${arrow}
      </div>
    `;
  }).join('');
}

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
      const detail = await fetchAbilityDetail(`https://pokeapi.co/api/v2/ability/${a}`);

      return `
        <div class="rounded-2xl bg-gray-100/50 p-4 
                    border border-gray-200/50 
                    opacity-0 animate-fade-slide-up" 
             style="animation-delay: ${0.4 + i * 0.1}s"> 
          <div class="flex items-center gap-2 mb-1.5"> 
            <span class="font-display font-bold text-gray-800 capitalize"> 
              ${a.replace(/-/g, ' ')} 
            </span> 
          </div> 
          <p class="text-sm text-gray-500 leading-relaxed"> 
            ${detail.description} 
          </p> 
        </div>`;
    })
  );

  container.innerHTML = abilitiesHtml.join('');
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

  document.querySelector('.moves-count').textContent = `${totalCount} ataques`;

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
                   ${currentFilter === 'all' ? 'bg-coral text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
      Todos
    </button>`;

  const methodBtns = methods.map(m => `
    <button onclick="setMoveFilter('${m}')" 
            class="move-filter-btn px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors 
                   ${currentFilter === m ? 'bg-coral text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
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
    <tr class="border-b border-gray-200/50 last:border-0 
               opacity-0 animate-fade-slide-up" 
        style="animation-delay: ${i * 0.02}s"> 
      <td class="py-2 font-medium capitalize text-gray-800"> 
        ${m.name.replace(/-/g, ' ')} 
        ${m.level > 0 ? `<span class="text-xs text-gray-400 ml-1">Lv.${m.level}</span>` : ''} 
      </td> 
      <td class="py-2"> 
        ${m.type ? `<span class="type-badge type-badge-sm bg-type-${m.type}">${m.type}</span>` : ''} 
      </td> 
      <td class="py-2 text-center font-display font-bold text-gray-800"> 
        ${m.power ?? '—'} 
      </td> 
      <td class="py-2 text-center text-gray-500"> 
        ${m.accuracy ? m.accuracy + '%' : '—'} 
      </td> 
      <td class="py-2 text-center text-gray-500"> 
        ${m.pp ?? '—'} 
      </td> 
      <td class="py-2"> 
        ${m.damageClass ? ` 
          <span class="px-2 py-0.5 rounded-full text-xs font-medium capitalize 
                       ${DAMAGE_CLASS_STYLES[m.damageClass] || 'bg-gray-200 text-gray-500'}"> 
            ${DAMAGE_CLASS_LABELS[m.damageClass] || m.damageClass} 
          </span>` : ''} 
      </td> 
    </tr> 
  `).join('');

  const expandContainer = document.querySelector('.moves-expand-container');
  if (filtered.length > 10) {
    expandContainer.classList.remove('hidden');
    const btn = document.querySelector('.moves-expand-btn');
    btn.textContent = movesExpanded 
      ? 'Mostrar Menos ▲' 
      : `Mostrar Todos os ${filtered.length} Ataques ▼`; 
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

  document.querySelector('.versions-count').textContent = `${versions.length} jogos`;

  const grouped = {};
  versions.forEach(v => {
    const gen = GEN_LABELS[v.generation] || v.generation;
    if (!grouped[gen]) grouped[gen] = [];
    grouped[gen].push(v);
  });

  container.innerHTML = Object.entries(grouped).map(([gen, vList], gi) => ` 
    <div class="opacity-0 animate-fade-slide-up" style="animation-delay: ${0.8 + gi * 0.05}s"> 
      <p class="text-xs font-medium text-gray-500 mb-1.5">${gen}</p> 
      <div class="flex flex-wrap gap-1.5"> 
        ${vList.map(v => ` 
          <span class="px-3 py-1 rounded-full text-xs font-medium capitalize 
                       ${VERSION_COLORS[v.name] || 'bg-gray-200 text-gray-500'}"> 
            ${v.name} 
          </span>`).join('')} 
      </div> 
    </div>` 
  ).join('');
}

/**
 * Renderiza as variedades/formas do Pokémon
 */
function renderVarieties(pokemon) {
  const container = document.querySelector('.varieties-container');
  if (!container) return;

  if (!pokemon.varieties || pokemon.varieties.length <= 1) {
    container.parentElement.classList.add('hidden');
    return;
  }

  container.parentElement.classList.remove('hidden');
  container.innerHTML = pokemon.varieties.map(v => {
    const isCurrent = v.id === pokemon.id;
    return `
      <a href="details.html?id=${v.id}" 
         class="px-4 py-2 rounded-xl text-xs font-bold border transition-all 
                ${isCurrent 
                  ? 'bg-coral text-white border-coral shadow-md active' 
                  : 'bg-white text-gray-500 border-black/5 hover:bg-black/5'}">
        ${v.name.replace(pokemon.name + '-', '').replace('-', ' ') || 'Normal'}
      </a>
    `;
  }).join('');
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
  const iconContainer = document.querySelector('.cry-icon-container');
  
  audio = new Audio(url);
  btn.textContent = 'Tocando...';
  iconContainer.innerHTML = '<i data-lucide="volume-x" class="w-5 h-5"></i>';
  if (window.lucide) lucide.createIcons();
  
  audio.play().catch(() => {
    btn.textContent = 'Ouvir Som';
    iconContainer.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
    if (window.lucide) lucide.createIcons();
  });
  
  audio.onended = () => {
    btn.textContent = 'Ouvir Som';
    iconContainer.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
    if (window.lucide) lucide.createIcons();
  };
  
  audio.onerror = () => {
    btn.textContent = 'Ouvir Som';
    iconContainer.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
    if (window.lucide) lucide.createIcons();
  };
}

/**
 * Renderiza as estatísticas com destaque de cores
 */
function renderStats(stats) {
  const maxVal = Math.max(...stats.map(s => s.value));
  const minVal = Math.min(...stats.map(s => s.value));
  
  const statsContainer = document.getElementById('stats-bar-view');
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
        <span class="w-5 flex justify-center text-coral">
          <i data-lucide="${ICONS[s.label] || 'zap'}" class="w-4 h-4"></i>
        </span>
        <span class="w-16 text-xs font-medium text-gray-500 uppercase tracking-wide">${s.label}</span>
        <span class="w-10 text-sm font-bold font-display text-right ${textColor}">${s.value}</span>
        <div class="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
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
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => history.back());
  }

  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

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
      flavor_text: data.flavor_text || '',
      varieties: data.varieties || [],
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

    // Flavor Text
    const flavorTextContainer = document.querySelector('.flavor-text');
    if (flavorTextContainer) {
      flavorTextContainer.textContent = pokemon.flavor_text ? `"${pokemon.flavor_text}"` : '';
    }

    // Varieties Selector
    renderVarieties(pokemon);
    
    // Types
    document.querySelector('.types').innerHTML = pokemon.types.map(type => `
      <span class="type-badge type-badge-md bg-type-${type}">
        ${type}
      </span>
    `).join('');

    // Physical
    document.querySelector('.height-value').textContent = `${pokemon.height / 10} m`;
    document.querySelector('.weight-value').textContent = `${pokemon.weight / 10} kg`;

    // Abilities (Detailed)
    try {
      await renderAbilities(pokemon.abilities);
    } catch (e) {
      console.error('Erro ao renderizar habilidades:', e);
    }

    // Evolution Chain
    try {
      await renderEvolutionChain(pokemon.id);
    } catch (e) {
      console.error('Erro ao renderizar evolução:', e);
    }

    // Moves
    try {
      await renderMoves(pokemon.id);
    } catch (e) {
      console.error('Erro ao renderizar movimentos:', e);
    }

    // Game Versions
    try {
      await renderGameVersions(pokemon.id);
    } catch (e) {
      console.error('Erro ao renderizar versões:', e);
    }

    // Stats
    try {
      renderStats(pokemon.stats);
      setupStatsToggle(pokemon.stats);
    } catch (e) {
      console.error('Erro ao renderizar stats:', e);
    }

    // Favorite Button Logic
    setupFavoriteButton(pokemon.id, data.is_favorite);

    // Cry button
    const cryBtn = document.querySelector('.cry-btn');
    if (cryBtn) {
      cryBtn.addEventListener('click', () => playCry(pokemon.cry_url));
    }

    // Initialize icons
    if (window.lucide) lucide.createIcons();

    // Hide loading overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.remove(), 500);
    }

  } catch (error) {
    console.error('Erro crítico no init:', error);
    
    // Hide loading overlay on error too
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();

    alert('Erro ao carregar detalhes do Pokémon.');
    // window.location.href = 'dashboard.html';
  }
}

/**
 * Configura o botão de favoritos
 */
async function setupFavoriteButton(pokemonId, isFavorite) {
  const favBtn = document.getElementById('favorite-btn');
  if (!favBtn) return;

  const icon = favBtn.querySelector('i');
  
  if (isFavorite) {
    icon.classList.add('fill-coral', 'text-coral');
  }

  favBtn.onclick = async () => {
    try {
      const response = await api.post('/favorites', { pokemonId });
      
      if (response.success) {
        icon.classList.add('fill-coral', 'text-coral');
      } else {
        // Tenta remover se já for favorito
        const deleteRes = await api.delete(`/favorites/${pokemonId}`);
        if (deleteRes.success) {
          icon.classList.remove('fill-coral', 'text-coral');
        }
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  init();
  
  // Logout logic
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }
});
