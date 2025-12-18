import jwt from "jsonwebtoken";
import 'dotenv/config';
import { prisma } from "config/client";
import bcrypt from 'bcryptjs';


const hashPassword = async (plainText: string) => {
    const saltRounds = 10;
    return await bcrypt.hash(plainText, saltRounds)
}

const comparePassword = async (password: string, hashPassword: string) => {
    return await bcrypt.compare(password, hashPassword)
}

const generateToken = (user: any) => {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar,
            createdAt: user.createdAt,
            sumCart: user.sumCart
        },
        process.env.JWT_SECRET!,
        { expiresIn: "3h" }
    );
}

const isEmailExist = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email }
    })
    if (user) return true;
    return false;
}


const createUser = async (name: string, email: string, password: string) => {
    const newPwd = await hashPassword(password)
    return await prisma.user.create({
        data: {
            name,
            email,
            password: newPwd
        }
    })
}

const getUserSumCart = async (user_id: number) => {
    const user = await prisma.cart.findUnique({
        where: { user_id: user_id },
    });


    return user?.sum ?? 0;
}
const getUserByid = async (user_id: number) => {
    const user = await prisma.user.findUnique({
        where: { id: user_id }
    })

    if (!user) return null

    const { password, ...safeUser } = user
    return safeUser
}

export { generateToken, isEmailExist, createUser, hashPassword, getUserSumCart, getUserByid, comparePassword }