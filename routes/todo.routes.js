const express = require("express");
const router = express.Router();
const todoController = require("../controller/todo.Controller");
const { authMiddleware, requireUser } = require("../Middleware/Auth");

// All routes require authentication
router.use(authMiddleware);
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

module.exports = router;


// GET /api/todos?page=1&limit=10&status=completed&category=work&priority=high&year=2024&month=1&search=project&sortBy=createdAt&sortOrder=desc
// Authorization: Bearer <token>

// GET /api/todos/stats?year=2024&month=1
// Authorization: Bearer <token>

// ?date=2024-01-15 - All todos from specific date