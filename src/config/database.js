
const mongoose=require('mongoose')

const connectDB= async() =>{
    await mongoose.connect(
        "mongodb+srv://namastedev:xGPCbUJY889RivEc@namastenode.9brbmky.mongodb.net/devTinder"
    );

}
module.exports = connectDB;