const express = require('express'); 
const router = express.Router(); 
const teamsController = require('../controllers/teamsController'); 
const { verifyToken } = require('../middleware/authMiddleware'); 
 
router.get('/', verifyToken, teamsController.getTeams); 
router.post('/', verifyToken, teamsController.createTeam); 
router.put('/:id', verifyToken, teamsController.updateTeam);
router.delete('/:id', verifyToken, teamsController.deleteTeam); 
 
module.exports = router; 
