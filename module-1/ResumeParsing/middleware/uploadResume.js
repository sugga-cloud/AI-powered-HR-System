// middleware/uploadResume.js
import multer from "multer";

const storage = multer.memoryStorage();

const allowed = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF or DOCX files allowed"));
    }
    cb(null, true);
  }
});
