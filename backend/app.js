
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import database from './database/db.js'
import Route from './routes/authRoute.js'
import conversationRoute from './routes/conversationRoute.js'
import verifyRoute from './routes/verifyRoute.js'
import { verifyToken } from './middleware/auth.js'
import User from './models/userModel.js'


const app = express()

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500',
}));

app.use(express.json())
dotenv.config()

// Connect to database
database()

// Routes
app.use('/auth', Route)
app.use('/api/conversations', conversationRoute)
app.use('/auth', verifyRoute)
app.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email");
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`)
})