import multer from "multer";
import path from "path";

// Define storage settings for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("file destination");
    cb(null, "public/"); // Save files to the "uploads" folder
  },
  filename: function (req, file, cb) {
    console.log("file received");
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
    console.log("file type true");
    cb(null, true);
  } else {
    console.log("only image files are allowed");
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
