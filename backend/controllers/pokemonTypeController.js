const PokemonType = require('../models/PokemonType');

/**
 * Controller responsável por lidar com requisições relacionadas a tipos Pokémon.
 */
class PokemonTypeController {
    /**
     * Lista todos os tipos Pokémon cadastrados no banco.
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async list(req, res) {
        try {
            const types = await PokemonType.findAll();
            
            return res.status(200).json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('Erro em PokemonTypeController.list:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao listar tipos Pokémon.'
            });
        }
    }

    /**
     * Busca um tipo específico pelo nome.
     * @param {Object} req - Objeto de requisição do Express.
     * @param {Object} res - Objeto de resposta do Express.
     */
    static async getByName(req, res) {
        try {
            const { name } = req.params;
            const type = await PokemonType.findByName(name);

            if (!type) {
                return res.status(404).json({
                    success: false,
                    message: `Tipo "${name}" não encontrado.`
                });
            }

            return res.status(200).json({
                success: true,
                data: type
            });
        } catch (error) {
            console.error('Erro em PokemonTypeController.getByName:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar tipo Pokémon.'
            });
        }
    }
}

module.exports = PokemonTypeController;
