import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    hashPassword,
    comparePassword,
    generateToken,
    isEmailExist,
    createUser,
    getUserSumCart,
    getUserByid,
} from "services/auth.service";
import { prisma } from "config/client";

// MOCK
jest.mock("bcryptjs", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
}));

jest.mock("config/client", () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        cart: {
            findUnique: jest.fn(),
        },
    },
}));

describe("AUTH SERVICE - UNIT TEST", () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    // HASH PASSWORD
    it("should hash password", async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPwd");

        const result = await hashPassword("123456");

        expect(bcrypt.hash).toHaveBeenCalled();
        expect(result).toBe("hashedPwd");
    });

    // COMPARE PASSWORD
    it("should return true if password matches", async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await comparePassword("123456", "hashedPwd");

        expect(result).toBe(true);
    });

    it("should return false if password not match", async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        const result = await comparePassword("123456", "hashedPwd");

        expect(result).toBe(false);
    });

    // GENERATE TOKEN
    it("should generate jwt token", () => {
        (jwt.sign as jest.Mock).mockReturnValue("jwt-token");

        const token = generateToken({
            id: 1,
            name: "User",
            email: "user@gmail.com",
            role: "customer",
        });

        expect(jwt.sign).toHaveBeenCalled();
        expect(token).toBe("jwt-token");
    });

    // EMAIL EXIST
    it("should return true if email exists", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

        const result = await isEmailExist("test@gmail.com");

        expect(result).toBe(true);
    });

    it("should return false if email not exist", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await isEmailExist("test@gmail.com");

        expect(result).toBe(false);
    });

    // CREATE USER
    it("should create user with hashed password", async () => {
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPwd");
        (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1 });

        const result = await createUser(
            "Test",
            "test@gmail.com",
            "123456"
        );

        expect(prisma.user.create).toHaveBeenCalled();
        expect(result.id).toBe(1);
    });

    // GET USER SUM CART
    it("should return cart sum if exists", async () => {
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue({ sum: 5 });

        const result = await getUserSumCart(1);

        expect(result).toBe(5);
    });

    it("should return 0 if cart not exists", async () => {
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getUserSumCart(1);

        expect(result).toBe(0);
    });

    // GET USER BY ID
    it("should return user without password", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            name: "Test",
            password: "hashedPwd",
        });

        const result = await getUserByid(1);

        expect(result).not.toHaveProperty("password");
    });

    it("should return null if user not found", async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getUserByid(999);

        expect(result).toBeNull();
    });
});
