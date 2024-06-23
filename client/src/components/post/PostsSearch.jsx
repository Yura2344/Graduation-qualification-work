import { Search } from "@mui/icons-material";
import { Box, Button, MenuItem, Paper, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { axiosInstance } from "../../axios";
import Post from "./Post";

export default function PostsSearch() {
  const [posts, setPosts] = useState([]);

  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("any");

  const [title, setTitle] = useState("");
  const [costFrom, setCostFrom] = useState(0);
  const [costTo, setCostTo] = useState(0);
  const [currency, setCurrency] = useState("UAH");

  function searchPosts() {
    let queryParams = {};
    if (content !== "") queryParams.content = content;
    if (postType !== "") {
      queryParams.type = postType;
      if (postType === "advertisement") {
        if (title !== "") queryParams.title = title;
        queryParams.costFrom = costFrom || 0;
        queryParams.costTo = costTo || 0;
        queryParams.currency = currency;
      }
    }

    axiosInstance.get(`/posts`, { params: queryParams }).then((res) => {
      setPosts(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
    axiosInstance.get(`/posts`).then((res) => {
      setPosts(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }, []);

  return (
    <Box sx={{
      p: 1,
      display: "flex",
      flexDirection: "column",
      rowGap: 2
    }}>
      <Paper sx={{ p: 1, display: "flex", flexDirection: "column", rowGap: 2, alignItems: "flex-start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", rowGap: 2, width: "100%" }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", rowGap: 1 }}>
            <TextField fullWidth value={content} onChange={(e) => setContent(e.target.value)} label="Search content" />
            <TextField sx={{ width: "160px" }} select label="Post type" onChange={(e) => setPostType(e.target.value)} value={postType}>
              <MenuItem value="any">Any</MenuItem>
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="advertisement">Advertisement</MenuItem>
            </TextField>
          </Box>
          {
            postType === "advertisement" &&
            <Box sx={{ display: "flex", columnGap: 1 }}>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <TextField type="number" label="Cost from" value={costFrom} onChange={(e) => setCostFrom(e.target.value)} />
              <TextField type="number" label="Cost to" value={costTo} onChange={(e) => setCostTo(e.target.value)} />
              <TextField sx={{ width: "150px" }} select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <MenuItem value="UAH">UAH</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Box>
          }

        </Box>


        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={searchPosts}
        >
          Search
        </Button>
      </Paper>
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 2,
        alignItems: "center",
        p: 2
      }}>
        {
          posts.length > 0 && posts.map((post) => (
            <Post key={post.id} postData={post} />))
        }
      </Box>
    </Box>
  );
}