import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

import { axiosInstance } from "../axios";
import Post from "../components/post/Post";
import { useUserContext } from "../components/user/UserContext";

export default function FollowingPosts(){
  const {user} = useUserContext();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if(user){
      axiosInstance.get(`/users/me/followings_posts`).then((res) => {
        setPosts(res.data);
      }).catch((err) => {
        console.log(err);
      })
    }
  }, [user]);

  return (
    <Box sx={{
      p: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      rowGap: 2
    }}>
    {
      user ? (posts.length > 0 ? posts.map((post) => (
        <Post key={post.id} postData={post}/>
      )) : <Typography>No posts, maybe you shold follow someone</Typography>) : 
        <Typography>You must be logged in to see your followings posts</Typography>
      
    }
    </Box>
  );
}