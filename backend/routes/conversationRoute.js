import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import Conversation from '../models/conversationModel.js'
const router = express.Router()

// create a conversation
router.post('/', verifyToken, async (req, res) => {
    try {
        const conv = await Conversation.create({ userId: req.user.id, messages: [] });
        res.json(conv);
    } catch (err) {
        res.status(500).json({ error: err.message })
    }

})

// Add message
router.post('/:id/messages', verifyToken, async (req, res) => {
    const { role, content } = req.body
    try {
        const conv = await Conversation.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: { role, content } } },
            { new: true }
        )
        if (!conv) return res.status(404).json({ error: "Conversation non trouvée pour l'ajout des messages" });
        res.json(conv)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Get all user conversation
router.get('/', verifyToken, async (req, res) => {
    try {
        const conv = await Conversation.find({ userId: req.user.id })
        if (!conv) return res.status(404).json({ error: "Conversations non trouvée" });
        res.json(conv)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Get messages from a conversation
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id)
        if (!conv) return res.status(404).json({ error: "Conversation non trouvée pour la recupération des messages" });
        res.json(conv)
    } catch(err) {
        res.status(500).json({ error: err.message })
    }

})

export default router