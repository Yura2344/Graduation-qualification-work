import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

import { axiosInstance } from "../axios";
import Post from "../components/post/Post";

export default function Posts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axiosInstance.get("/posts").then((res) => {
      setPosts(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }, []);

  return (
    <Box sx={{
      p: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      rowGap: 2
    }}>
      {
        posts.length > 0 ? posts.map((post) => (
          <Post key={post.id} postData={post} />
        )) : <Typography>No posts</Typography>
      }
    </Box>
  )
}