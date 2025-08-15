import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ MongoDB connecté')
    } catch(err) {
        console.error('❌ Erreur de connexion MongoDB :', err.message)
        process.exit(1)
    }
}

export default connectDB