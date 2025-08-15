import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
    userId: String,
    messages: [{
        role: String,
        content: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Conversation', conversationSchema)

