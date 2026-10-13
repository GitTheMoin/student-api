const Student = require("../models/Student");

console.log(typeof Student, Student);

const FIELDS = ["studentId", "name", "email", "department", "semester", "contact"];

// Copy only allowed fields from the request body
const pick = (body) =>
  FIELDS.reduce((obj, f) => {
    if (body[f] !== undefined) obj[f] = body[f];
    return obj;
  }, {});

// Convert errors into clean responses without leaking internals
const handleError = (err, res) => {
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Student ID already exists" });
  }
  console.error(err); // full details only in server logs
  return res.status(500).json({ success: false, message: "Internal server error" });
};

// GET /api/students  (optional ?search=text)
exports.getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const s = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { studentId: { $regex: s, $options: "i" } },
      ];
    }
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (err) {
    handleError(err, res);
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    handleError(err, res);
  }
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(pick(req.body));
    res.status(201).json({ success: true, message: "Student added successfully", data: student });
  } catch (err) {
    handleError(err, res);
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const updates = pick(req.body);
    delete updates.studentId; // ID can't be changed

    const student = await Student.findOneAndUpdate(
      { studentId: req.params.id.toUpperCase() },
      updates,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.status(200).json({ success: true, message: "Student updated successfully", data: student });
  } catch (err) {
    handleError(err, res);
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ studentId: req.params.id.toUpperCase() });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    handleError(err, res);
  }
};