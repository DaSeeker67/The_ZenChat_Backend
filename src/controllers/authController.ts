import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";
import { signToken } from "../utils/jwt";
import { Request, Response } from "express";

const prisma= new PrismaClient();

export const register= async(req: Request, res: Response)=>{
    const {email,password,username} = req.body;
    const hashedPass= await bcrypt.hash(password,10);
    try{
        const user= await prisma.user.create({
            data:{
                email,
                username,
                password:hashedPass,
            }
        });
        const token= signToken(user.id);
        res.status(201).json({
            message:"User created successfully",
            token,
            user:{
                id:user.id,
            }
        })
    }catch(error){
        res.status(500).json({
            message:"Theres error in Registering",
            error:error
        })
    }
};

export const login = async(req: Request, res: Response)=>{
    const {email,password} = req.body;
    const user= await prisma.user.findUnique({where:{email}});
    if(!user){
        return res.status(401).json({error: " signin first"});

    }

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(401).json({error: "Invalid credentials"});
    
    const token= signToken(user.id);
    res.status(200).json({
        message:"Login successful",
        token,
        user:{
            id:user.id,
        }
    })


}