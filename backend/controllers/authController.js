import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/userModel.js'

export const register = async (req, res) => {
    const { name, email, password } = req.body

    try {
        const exist = await User.findOne({ email })
        if (exist) return res.status(400).json({
            message : 'User already exists'
        })
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()
        res.status(201).json({
            message: 'Inscription réussie'
        })
    } catch(err) {
        res.status(500).json({
            message: 'Error server'
        })
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({
            message: 'Utilisateur non trouvé'
        })
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(401).json({
            message: 'Mot de passe incorrect'
        })
        const token = jwt.sign({ id:user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        })
        res.status(200).json({
            message: 'Connexion reussi !',
            token
        })
    } catch(err) {
        res.status(500).json({
            message: 'Erreur seveur'
        })
    }
}