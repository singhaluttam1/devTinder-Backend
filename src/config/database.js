
const mongoose=require('mongoose')

const connectDB = async() =>{
    await mongoose.connect(
        process.env.MONGODB_CONNECTION_URI
    );

}
module.exports = connectDB;