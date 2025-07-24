jwt=require('jsonwebtoken')
const User = require('../models/user');
require('dotenv').config(); 
const jwtSecret = process.env.JWT_SECRET_KEY;

const userAuth=async(req,res,next)=>{
    try {
        
        //Read the token from the req body
        const {token}=req.cookies
        if(!token){
            return res.status(401).send("Unauthorized: No token provided");
            
        }
        const decodedObj= await jwt.verify(token,jwtSecret)
        const {_id}=decodedObj
        const user=await User.findById(_id)
        if(!user){
            return res.status(404).send("User not found")
        }
        req.user=user
        next()
    } catch (err) {
        res.status(404).send("Error:" + err.message);
        
    }

}
module.exports={
     userAuth
}