const fs = require("fs").promises;
const path = require("path");

async function deleteImage(imagePath: string) {
  try {
    const fullPath = path.join(__dirname, "../../public", imagePath);

    await fs.access(fullPath); // throws if file not found
    await fs.unlink(fullPath);

    return true;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.warn("File not found (cannot delete):", imagePath);
    } else {
      console.error("Error deleting image:", error);
    }
    return false;
  }
}

export default deleteImage;
