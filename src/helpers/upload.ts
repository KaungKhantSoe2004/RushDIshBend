import multer from "multer";
import path from "path";

// Define storage settings for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/"); // Save files to the "uploads" folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter to allow only images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: any
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Multer upload function
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware function to handle single file uploads
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
