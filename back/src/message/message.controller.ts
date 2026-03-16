import type { Request, Response } from "express";
import { messageServices } from "./message.service.js";
import type { MessageInputUpdate } from "./dto/message.dto.js";

class MessageController {

    public async create (req: Request, res: Response) {
        try {
            const message = await messageServices.create(req.body);
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Error creating message' });
        }
    }

    public async update (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        const messageData = req.body;
        try {
            const message = await messageServices.update(id, messageData as MessageInputUpdate);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }
            res.json(message);
        } catch (error) {
            res.status(500).json({ error: 'Error updating message' });
        }
    }

    public async delete (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        try {
            const message = await messageServices.delete(id);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }
            res.json(message);
        } catch (error) {
            res.status(500).json({ error: 'Error deleting message' });
        }
    }

    public async getOne (req: Request, res: Response) {
        const id : string = req.params.id as string || "";
        try {
            const message = await messageServices.getById(id);
            if (!message) {
                return res.status(404).json({ error: 'Message not found' });
            }
            res.json(message);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching message' });
        }
    }

    public async getByUser (req: Request, res: Response) {
        const userId : string = req.params.userId as string || "";
        try {
            const messages = await messageServices.getByUser(userId);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching messages' });
        }
    }

    public async getConversation (req: Request, res: Response) {
        const { user1Id, user2Id } = req.body;
        try {
            const messages = await messageServices.getConversation(user1Id, user2Id);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching conversation' });
        }
    }

}

export const messageController = new MessageController();