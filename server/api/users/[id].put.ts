import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const url = event.node.req.url;
    const userId = url?.split("/").pop();

    if (!userId) {
      return {
        statusCode: 400,
        statusMessage: "User ID is required"
      };
    }

    const body = await readBody(event);
    if (!body) {
      return {
        statusCode: 400,
        statusMessage: "Request body is required"
      };
    }

    const filePath = join(process.cwd(), 'data', 'auth.json');
    const authData = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Find user index
    const userIndex = authData.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return {
        statusCode: 404,
        statusMessage: "User not found"
      };
    }

    // Update user data
    authData[userIndex] = { ...authData[userIndex], ...body };

    // Write updated users data back to file
    writeFileSync(filePath, JSON.stringify(authData, null, 2), "utf-8");

    // Return updated user (without password for security)
    const updatedUser = {
      id: authData[userIndex].id,
      name: authData[userIndex].name,
      email: authData[userIndex].email,
      role: authData[userIndex].role,
      photoURL: authData[userIndex].photoURL
    };

    return updatedUser;
  } catch (error) {
    return {
      statusCode: 500,
      statusMessage: "Internal server error"
    };
  }
})
                