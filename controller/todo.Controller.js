import Todo from "../models/todo.model.js";

// Create new todo
export const createTodo = async (req, res) => {
  try {
    const { title, description, category, dueDate, priority, attachments, date } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Create todo with user info and request details
    const todo = await Todo.create({
      user: userId,
      title,
      description,
      category,
      dueDate,
      priority,
      attachments,
      date: date ? new Date(date) : new Date(), // Use provided date or current date
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Populate user details
    await todo.populate('user', 'name email');

    res.status(201).json({
      message: "Todo created successfully",
      todo
    });
  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({ message: "Failed to create todo", error: error.message });
  }
};

// Get todos with filtering and pagination
export const getTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      year,
      month,
      date,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user: userId };

    // Status filter (completed/incomplete)
    if (status !== undefined) {
      filter.completed = status === 'completed' ? true : false;
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Priority filter
    if (priority) {
      filter.priority = priority;
    }

    // Date filters
    if (year || month || date) {
      const dateFilter = {};

      if (year) {
        dateFilter.$gte = new Date(parseInt(year), 0, 1);
        dateFilter.$lt = new Date(parseInt(year) + 1, 0, 1);
      }

      if (month && year) {
        dateFilter.$gte = new Date(parseInt(year), parseInt(month) - 1, 1);
        dateFilter.$lt = new Date(parseInt(year), parseInt(month), 1);
      }

      if (date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        dateFilter.$gte = targetDate;
        dateFilter.$lt = nextDate;
      }

      filter.date = dateFilter;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get todos with pagination
    const todos = await Todo.find(filter)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTodos = await Todo.countDocuments(filter);
    const totalPages = Math.ceil(totalTodos / parseInt(limit));

    // Get statistics
    const stats = await Todo.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    // Get category statistics
    const categoryStats = await Todo.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      message: "Todos retrieved successfully",
      todos,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTodos,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      stats: stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0
      },
      categoryStats
    });
  } catch (error) {
    console.error("Get todos error:", error);
    res.status(500).json({ message: "Failed to retrieve todos", error: error.message });
  }
};

// Get single todo by ID
export const getTodoById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findOne({ _id: id, user: userId })
      .populate('user', 'name email');

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({
      message: "Todo retrieved successfully",
      todo
    });
  } catch (error) {
    console.error("Get todo by ID error:", error);
    res.status(500).json({ message: "Failed to retrieve todo", error: error.message });
  }
};

// Update todo
export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({
      message: "Todo updated successfully",
      todo
    });
  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({ message: "Failed to update todo", error: error.message });
  }
};

// Delete todo
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.status(200).json({
      message: "Todo deleted successfully",
      todo
    });
  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ message: "Failed to delete todo", error: error.message });
  }
};

// Toggle todo completion status
export const toggleTodoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const todo = await Todo.findOne({ _id: id, user: userId });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    todo.completed = !todo.completed;
    await todo.save();

    await todo.populate('user', 'name email');

    res.status(200).json({
      message: `Todo ${todo.completed ? 'completed' : 'marked as pending'} successfully`,
      todo
    });
  } catch (error) {
    console.error("Toggle todo status error:", error);
    res.status(500).json({ message: "Failed to toggle todo status", error: error.message });
  }
};

// Get todo statistics
export const getTodoStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    // Build date filter
    const dateFilter = { user: userId };
    if (year || month) {
      const dateRange = {};

      if (year) {
        dateRange.$gte = new Date(parseInt(year), 0, 1);
        dateRange.$lt = new Date(parseInt(year) + 1, 0, 1);
      }

      if (month && year) {
        dateRange.$gte = new Date(parseInt(year), parseInt(month) - 1, 1);
        dateRange.$lt = new Date(parseInt(year), parseInt(month), 1);
      }

      dateFilter.date = dateRange;
    }

    // Get overall statistics
    const stats = await Todo.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          completionRate: { $avg: { $cond: ['$completed', 1, 0] } }
        }
      }
    ]);

    // Get monthly statistics for the current year
    const monthlyStats = await Todo.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get category distribution
    const categoryStats = await Todo.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get priority distribution
    const priorityStats = await Todo.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } }
        }
      }
    ]);

    res.status(200).json({
      message: "Todo statistics retrieved successfully",
      stats: stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0
      },
      monthlyStats,
      categoryStats,
      priorityStats
    });
  } catch (error) {
    console.error("Get todo stats error:", error);
    res.status(500).json({ message: "Failed to retrieve todo statistics", error: error.message });
  }
};

