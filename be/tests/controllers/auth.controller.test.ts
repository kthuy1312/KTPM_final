import { getAccount, loginWithJWT, postRegister } from "controllers/auth-controller";
import { Request, Response } from "express";
import { createUser, generateToken, getUserByid } from "services/auth.service";
import { RegisterSchema } from "src/validation/register.schema";

// Mock service
jest.mock("services/auth.service", () => ({
    createUser: jest.fn(),
    generateToken: jest.fn(),
    getUserByid: jest.fn(),
}));

describe("AUTH CONTROLLER - UNIT TEST", () => {

    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn(() => ({ json: jsonMock }));
        req = {};
        res = { status: statusMock, json: jsonMock };
        jest.clearAllMocks();
    });

    // ------------------ LOGIN ------------------
    it("loginWithJWT - should return token when user exists", () => {
        (req as any).user = { id: 1, name: "Test", email: "test@gmail.com" };
        (generateToken as jest.Mock).mockReturnValue("jwt-token");

        loginWithJWT(req as Request, res as Response);

        expect(generateToken).toHaveBeenCalledWith(req.user);
        expect(jsonMock).toHaveBeenCalledWith({
            message: "Login successful",
            token: "jwt-token",
        });
    });

    it("loginWithJWT - should return 401 when user missing", () => {
        (req as any).user = null;
        loginWithJWT(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({ message: "Email / Password không đúng" });
    });

    // ------------------ REGISTER ------------------
    it("postRegister - should return 201 and new user on success", async () => {
        req.body = { name: "Test", email: "test@gmail.com", password: "123456", confirmPassword: "123456" };
        (createUser as jest.Mock).mockResolvedValue({ id: 1, name: "Test", email: "test@gmail.com" });

        // bypass zod validation
        jest.spyOn(RegisterSchema, "safeParseAsync").mockResolvedValue({ success: true, data: req.body, });

        await postRegister(req as Request, res as Response);

        expect(createUser).toHaveBeenCalledWith("Test", "test@gmail.com", "123456");
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
            success: true,
            message: "Đăng ký thành công",
            user: { id: 1, name: "Test", email: "test@gmail.com" },
        });
    });

    it("postRegister - should return 400 if validation fails", async () => {
        req.body = { name: "", email: "invalid", password: "123", confirmPassword: "456" };
        (RegisterSchema.safeParseAsync as jest.Mock).mockResolvedValue({
            success: false,
            error: { issues: [{ path: ["name"], message: "Required" }] },
        });

        await postRegister(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            errors: [{ field: "name", message: "Required" }],
            oldData: req.body,
        });
    });

    it("postRegister - should return 500 if createUser throws error", async () => {
        req.body = { name: "Test", email: "test@gmail.com", password: "123456", confirmPassword: "123456" };
        jest.spyOn(RegisterSchema, "safeParseAsync").mockResolvedValue({ success: true, data: req.body });
        (createUser as jest.Mock).mockRejectedValue(new Error("DB error"));

        await postRegister(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "Có lỗi xảy ra khi đăng ký",
            error: expect.any(Error),
        });
    });

    // ------------------ GET ACCOUNT ------------------
    it("getAccount - should return user data on success", async () => {
        (req as any).user = { id: 1 };
        (getUserByid as jest.Mock).mockResolvedValue({ id: 1, name: "Test" });

        await getAccount(req as Request, res as Response);

        expect(getUserByid).toHaveBeenCalledWith(1);
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({
            success: true,
            message: "Lấy thông tin account thành công",
            data: { user: { id: 1, name: "Test" } },
        });
    });

    it("getAccount - should return 500 if getUserByid throws error", async () => {
        (req as any).user = { id: 1 };
        (getUserByid as jest.Mock).mockRejectedValue(new Error("DB error"));

        await getAccount(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            success: false,
            message: "Có lỗi khi lấy thông tin account",
            error: expect.any(Error),
        });
    });

    //4 case white box 
    describe("AUTH CONTROLLER - LOGIN LOGIC CASES", () => {

        // TC-LOGIN-01: Đúng email + password -> return token
        it("TC-LOGIN-01: should return token when credentials are correct", () => {
            (req as any).user = { id: 1, name: "Test", email: "test@gmail.com" };
            (generateToken as jest.Mock).mockReturnValue("jwt-token");

            loginWithJWT(req as Request, res as Response);

            expect(generateToken).toHaveBeenCalledWith(req.user);
            expect(jsonMock).toHaveBeenCalledWith({
                message: "Login successful",
                token: "jwt-token",
            });
        });

        // TC-LOGIN-02: IF email không tồn tại -> trả về message mặc định của controller
        it("TC-LOGIN-02: should return 401 when user missing", () => {
            (req as any).user = null;
            loginWithJWT(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Email / Password không đúng" });
        });

        // TC-LOGIN-03: IF email bị khóa (Cập nhật theo logic controller thực tế của bạn)
        it("TC-LOGIN-03: should handle disabled account", () => {
            (req as any).user = { id: 2, isActive: false };
            loginWithJWT(req as Request, res as Response);
        });

        // TC-LOGIN-04: IF password sai
        it("TC-LOGIN-04: should return 401 when password mismatch", () => {
            (req as any).user = null; // Thường Passport trả về null khi sai pass
            loginWithJWT(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: "Email / Password không đúng" });
        });
    });
});
