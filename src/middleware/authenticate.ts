import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

const JWT_SECRET : string | undefined = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be defined in environment variables");
}

export interface AuthRequest extends Request {
    userId?: number;
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        if (typeof payload === 'object' && 'userId' in payload) {
            req.userId = payload.userId;
            next();
        } else {
            return res.status(401).json({ error: "Invalid token payload" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};