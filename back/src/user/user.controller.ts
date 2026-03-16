import type { Request, Response } from "express";
import { userServices } from "./user.service.js";
import type { updateUserDto } from "./dto/user.dto.js";

class UserController {

    public async create (req: Request, res: Response) {
        try {
            const user = await userServices.create(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error creating user' });
        }
    }

    public async update (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        const userData = req.body;
        try {
            const user = await userServices.update(id, userData as updateUserDto);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error updating user' });
        }
    }

    public async delete (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        try {
            const user = await userServices.delete(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error deleting user' });
        }
    }

    public async getOne (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        try {
            const user = await userServices.getById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching user' });
        }
    }

    public async login (req: Request, res: Response) {
        const { email, password } = req.body;
        try {
            const token = await userServices.login(email, password);
            res.json({ token });
        } catch (error) {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }

    public async getAll (req: Request, res: Response) {
        try {
            const users = await userServices.getAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching users' });
        }
    }

    public async sendPublicKey (req: Request, res: Response) {
        //const userId : string = req.params.id as string || "";
        const { userId, publicKey } = req.body;
        try {
            const user = await userServices.update(userId, { publicKey });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json({ message: 'Public key updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error updating public key' });
        }
    }

    public async getPublicKey (req: Request, res: Response) {
        const userId : string = req.params.id as string || "";
        try {
            const publicKey = await userServices.getPublicKey(userId);
            if (!publicKey) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json({ publicKey });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching public key' });
        }
    }

    public async regenerateKeys (req: Request, res: Response) {
        const { userId, publicKey } = req.body;
        try {
            const user = await userServices.regenerateKeys(userId, publicKey);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json({ 
                message: 'Keys regenerated successfully',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    publicKey: user.publicKey
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error regenerating keys' });
        }
    }

    public async deactivateAccount (req: Request, res: Response) {
        const { userId } = req.body;
        try {
            const user = await userServices.deactivateAccount(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json({ 
                message: 'Account deactivated successfully',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error deactivating account' });
        }
    }

    public async deleteAccount (req: Request, res: Response) {
        const { userId } = req.body;
        try {
            const user = await userServices.deleteAccount(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json({ 
                message: 'Account deleted successfully',
                user: {
                    _id: user._id,
                    email: user.email
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error deleting account' });
        }
    }

}

export const userController = new UserController();