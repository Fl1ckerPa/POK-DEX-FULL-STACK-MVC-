const teamsModel = require('../models/teamsModel'); 
 
// GET /api/teams 
exports.getTeams = async (req, res) => { 
  try { 
    const userId = req.user.id; // vem do middleware JWT 
    const teams = await teamsModel.getTeamsByUser(userId); 
    res.json({ success: true, data: teams }); 
  } catch (error) { 
    console.error('Erro ao buscar times:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar times.' }); 
  } 
}; 
 
// POST /api/teams 
exports.createTeam = async (req, res) => { 
  try { 
    const userId = req.user.id; 
    const { name, slots } = req.body; 
 
    // Validações 
    if (!name || !name.trim()) { 
      return res.status(400).json({ success: false, message: 'Nome do time é obrigatório.' }); 
    } 
    if (name.trim().length > 30) { 
      return res.status(400).json({ success: false, message: 'Nome deve ter no máximo 30 caracteres.' }); 
    } 
    if (!slots || !Array.isArray(slots) || slots.length === 0) { 
      return res.status(400).json({ success: false, message: 'Adicione pelo menos um Pokémon.' }); 
    } 
    if (slots.length > 6) { 
      return res.status(400).json({ success: false, message: 'Máximo de 6 Pokémon por time.' }); 
    } 
 
    // Verificar duplicatas no time 
    const ids = slots.map(s => s.pokemon_id); 
    if (new Set(ids).size !== ids.length) { 
      return res.status(400).json({ success: false, message: 'Pokémon duplicados não são permitidos.' }); 
    } 
 
    const teamId = await teamsModel.createTeam(userId, name.trim(), slots); 
    res.status(201).json({ success: true, data: { id: teamId }, message: 'Time criado com sucesso!' }); 
  } catch (error) { 
    console.error('Erro ao criar time:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar time.' }); 
  } 
}; 
 
// DELETE /api/teams/:id 
exports.deleteTeam = async (req, res) => { 
  try { 
    const userId = req.user.id; 
    const teamId = req.params.id; 
 
    const team = await teamsModel.getTeamById(teamId, userId); 
    if (!team) { 
      return res.status(404).json({ success: false, message: 'Time não encontrado.' }); 
    } 
 
    await teamsModel.deleteTeam(teamId, userId); 
    res.json({ success: true, message: 'Time excluído com sucesso.' }); 
  } catch (error) { 
    console.error('Erro ao excluir time:', error);
    res.status(500).json({ success: false, message: 'Erro ao excluir time.' }); 
  } 
}; 
