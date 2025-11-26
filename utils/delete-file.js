import fs from "fs/promises";
import path from "path";

export const deleteFile = async (filePath) => {
    try {
        if (filePath) {
            await fs.unlink(path.join(process.cwd(), filePath));
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
};