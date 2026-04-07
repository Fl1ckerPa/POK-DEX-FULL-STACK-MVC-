const db = require('../config/database'); 
const { v4: uuidv4 } = require('uuid'); 
 
// Buscar times do usuário com seus slots e moves 
exports.getTeamsByUser = async (userId) => { 
  const [teams] = await db.query( 
    'SELECT * FROM teams WHERE user_id = ? ORDER BY created_at DESC', 
    [userId] 
  ); 
 
  // Para cada time, buscar os slots e seus moves 
  for (const team of teams) { 
    const [slots] = await db.query( 
      'SELECT * FROM team_slots WHERE team_id = ? ORDER BY slot_index ASC', 
      [team.id] 
    ); 

    for (const slot of slots) {
      const [moves] = await db.query(
        'SELECT move_name FROM team_slot_moves WHERE slot_id = ?',
        [slot.id]
      );
      slot.moves = moves.map(m => m.move_name);
    }

    team.slots = slots; 
  } 
 
  return teams; 
}; 
 
// Criar time + slots + moves em transação 
exports.createTeam = async (userId, name, slots) => { 
  const connection = await db.getConnection(); 
  try { 
    await connection.beginTransaction(); 
 
    const teamId = uuidv4(); 
    await connection.query( 
      'INSERT INTO teams (id, user_id, name) VALUES (?, ?, ?)', 
      [teamId, userId, name] 
    ); 
 
    for (const s of slots) { 
      const [slotResult] = await connection.query( 
        'INSERT INTO team_slots (team_id, slot_index, pokemon_id, pokemon_name, pokemon_image) VALUES (?, ?, ?, ?, ?)', 
        [teamId, s.slot_index, s.pokemon_id, s.pokemon_name, s.pokemon_image] 
      ); 

      const slotId = slotResult.insertId;
      if (s.moves && Array.isArray(s.moves)) {
        for (const moveName of s.moves) {
          await connection.query(
            'INSERT INTO team_slot_moves (slot_id, move_name) VALUES (?, ?)',
            [slotId, moveName]
          );
        }
      }
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

// Atualizar time (Edição)
exports.updateTeam = async (teamId, userId, name, slots) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Atualizar nome do time
    await connection.query(
      'UPDATE teams SET name = ? WHERE id = ? AND user_id = ?',
      [name, teamId, userId]
    );

    // Remover slots antigos (CASCADE removerá os moves)
    await connection.query('DELETE FROM team_slots WHERE team_id = ?', [teamId]);

    // Inserir novos slots e moves
    for (const s of slots) {
      const [slotResult] = await connection.query(
        'INSERT INTO team_slots (team_id, slot_index, pokemon_id, pokemon_name, pokemon_image) VALUES (?, ?, ?, ?, ?)',
        [teamId, s.slot_index, s.pokemon_id, s.pokemon_name, s.pokemon_image]
      );

      const slotId = slotResult.insertId;
      if (s.moves && Array.isArray(s.moves)) {
        for (const moveName of s.moves) {
          await connection.query(
            'INSERT INTO team_slot_moves (slot_id, move_name) VALUES (?, ?)',
            [slotId, moveName]
          );
        }
      }
    }

    await connection.commit();
    return true;
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
