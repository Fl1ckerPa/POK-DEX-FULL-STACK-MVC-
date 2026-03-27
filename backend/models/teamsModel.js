const db = require('../config/database'); 
const { v4: uuidv4 } = require('uuid'); 
 
// Buscar times do usuário com seus slots 
exports.getTeamsByUser = async (userId) => { 
  const [teams] = await db.query( 
    'SELECT * FROM teams WHERE user_id = ? ORDER BY created_at DESC', 
    [userId] 
  ); 
 
  // Para cada time, buscar os slots 
  for (const team of teams) { 
    const [slots] = await db.query( 
      'SELECT * FROM team_slots WHERE team_id = ? ORDER BY slot_index ASC', 
      [team.id] 
    ); 
    team.slots = slots; 
  } 
 
  return teams; 
}; 
 
// Criar time + slots em transação 
exports.createTeam = async (userId, name, slots) => { 
  const connection = await db.getConnection(); 
  try { 
    await connection.beginTransaction(); 
 
    const teamId = uuidv4(); 
    await connection.query( 
      'INSERT INTO teams (id, user_id, name) VALUES (?, ?, ?)', 
      [teamId, userId, name] 
    ); 
 
    for (let i = 0; i < slots.length; i++) { 
      const s = slots[i]; 
      await connection.query( 
        'INSERT INTO team_slots (team_id, slot_index, pokemon_id, pokemon_name, pokemon_image) VALUES (?, ?, ?, ?, ?)', 
        [teamId, i, s.pokemon_id, s.pokemon_name, s.pokemon_image] 
      ); 
    } 
 
    await connection.commit(); 
    return teamId; 
  } catch (error) { 
    await connection.rollback(); 
    throw error; 
  } finally { 
    connection.release(); 
  } 
}; 
 
// Buscar time por ID (verifica ownership) 
exports.getTeamById = async (teamId, userId) => { 
  const [rows] = await db.query( 
    'SELECT * FROM teams WHERE id = ? AND user_id = ?', 
    [teamId, userId] 
  ); 
  return rows[0] || null; 
}; 
 
// Deletar time (CASCADE deleta os slots) 
exports.deleteTeam = async (teamId, userId) => { 
  await db.query( 
    'DELETE FROM teams WHERE id = ? AND user_id = ?', 
    [teamId, userId] 
  ); 
}; 
