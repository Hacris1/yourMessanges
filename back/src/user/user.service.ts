import type { createUserDto, updateUserDto } from "./dto/user.dto.js";
import type { IUser } from "./user.model.js";
import { UserModel } from "./user.model.js";
import jwt from "jsonwebtoken";

class UserService {

    public async create (userData: createUserDto) : Promise<IUser> {
        const userExists : IUser | null = await this.getByEmail(userData.email);
        if (userExists) {
            throw new Error("User already exists");
        }

        return UserModel.create({
            name: userData.name,
            email: userData.email,
            password: userData.password
        });
    }

    public async update (userId: string, userData: updateUserDto) {
        try {

            const user: IUser | null = await UserModel.findOneAndUpdate({ _id: userId }, userData, { returnOriginal: false });

            return user;

        } catch (error) {
            if (error instanceof ReferenceError) {
                throw new Error("User not found");
            }
            throw error;
        }
    }

    public async delete (userId: string) {
        try {

            const user: IUser | null = await UserModel.findOneAndDelete({ _id: userId });

            return user;

        } catch (error) {
            if (error instanceof ReferenceError) {
                throw new Error("User not found");
            }
            throw error;
        }
    }

    public async getByEmail (email: string) {
        return UserModel.findOne({ email });
    }

    public async login (email: string, password: string) {
        const user: IUser | null = await this.getByEmail(email);
        if (!user) {
            throw new Error("User not found");
        }

        if (user.password !== password) {
            throw new Error("Invalid password");
        }

        const secret = "mi_clave_secreta";

        const token = jwt.sign({ 
            id: user._id,
            name: user.name,
            email: user.email,
            publicKey: user.publicKey
        }, secret, {
            expiresIn: "24h"
        });

        return token;
    }

    public async getById (userId: string) {
        return UserModel.findById({ _id: userId });
    }

    public async getAll () {
        return UserModel.find();
    }

    public async sendPublicKey (userId: string, publicKey: string) {
        try {
            const user : IUser | null = await this.getById(userId);
            if (!user) {
                throw new Error("User not found");
            }

            user.publicKey = publicKey;
            await user.save();

        } catch (error) {
            if (error instanceof ReferenceError) {
                throw new Error("User not found");
            }
            throw error;
        }
    }

}



export const userServices = new UserService();