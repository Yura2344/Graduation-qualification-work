import path from "node:path"
import url from "node:url"

export const serverPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

export const publicPath = path.join(serverPath, "public");
export const postsPath = path.join(publicPath, "posts");
export const groupChatsPath = path.join(publicPath, "group_chats");
export const avatarsPath = path.join(publicPath, "avatars");

export const privatePath = path.join(serverPath, "private");
export const personalChatsPath = path.join(privatePath, "chats");