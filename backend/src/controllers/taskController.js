import prisma from "../client.js";
import { Prisma } from "@prisma/client";

export const getTasks = async (req, res) => {
    const { listId } = req.validated.params;
    
    try {
        const tasks = await prisma.task.findMany({
            where: {
                listId
            }
        });
        res.status(200).json({
            data: tasks
        });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createTask = async (req, res) => {
    const { listId } = req.validated.params;
    const { name, description, position } = req.validated.body;

    try {
        const task = await prisma.task.create({
            data: {
                name,
                description,
                position,
                listId
            }
        });
        res.status(201).json({
            message: "Task created successfully",
            data: task
        });
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTaskById = async (req, res) => {
    const { taskId } = req.validated.params;

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        res.status(200).json({
            data: task
        });
    } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateTask = async (req, res) => {
    const { taskId } = req.validated.params;
    const { name, description, position } = req.validated.body;

    try {
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                name,
                description,
                position
            }
        });
        res.status(200).json({
            message: "Task updated successfully.",
            data: task
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteTask = async (req, res) => {
    const { taskId } = req.validated.params;

    try {
        await prisma.task.delete({
            where: { id: taskId }
        });
        res.status(200).json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ message: "Task not found" });
        }
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};