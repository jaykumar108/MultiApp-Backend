import express from "express";
const router = express.Router();
import * as todoController from "../controller/todo.Controller.js";
import { authToken, requireUser } from "../Middleware/Auth.js";

// All routes require authentication
router.use(authToken);
router.use(requireUser);

// POST /api/todos - Create new todo
router.post("/", todoController.createTodo);

// GET /api/todos - Get todos with filtering and pagination
router.get("/", todoController.getTodos);

// GET /api/todos/stats - Get todo statistics
router.get("/stats", todoController.getTodoStats);

// GET /api/todos/:id - Get single todo by ID
router.get("/:id", todoController.getTodoById);

// PUT /api/todos/:id - Update todo
router.put("/:id", todoController.updateTodo);

// DELETE /api/todos/:id - Delete todo
router.delete("/:id", todoController.deleteTodo);

// PATCH /api/todos/:id/toggle - Toggle todo completion status
router.patch("/:id/toggle", todoController.toggleTodoStatus);

export default router;


