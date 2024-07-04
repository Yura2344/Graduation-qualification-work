import express from "express";
import http from "node:http";

export const app = express();
export const server = http.createServer(app);