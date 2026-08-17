import jwt from "jsonwebtoken";

const auth = async (req , res, next) =>{
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || ! authHeader.statWith("Bearer")){
            return res.status(401).json({success: false, message: "Not authorized, no token"})
        }
    }catch(error){
console.errorg("Auth middleware error:", error.message);
return res.status(401).json({success: false, message: "Not authorized, token field"});

    }
}
export default auth;