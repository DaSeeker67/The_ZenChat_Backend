import jwt from "jsonwebtoken";
const JWT_SECRET : string | undefined = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be defined in environment variables");
}

export const signToken= (userId: number)=>{
    return jwt.sign({userId},JWT_SECRET,{expiresIn:"1d"});
}

export const verifyToken=(token :string)=>{
    return jwt.verify(token,JWT_SECRET);
}