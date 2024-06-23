import { useState } from "react";
import { Box, Paper, Tab, Tabs } from "@mui/material";
import { useNavigate } from "react-router";

import UsersSearch from "../components/user/UsersSearch";
import GroupChatsSearch from "../components/chat/GroupChatsSearch";
import PostsSearch from "../components/post/PostsSearch";

export default function SearchPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  return (
    <Paper sx={{
      p: 2,
      height: "100%",
      width: "100%",
      maxWidth: "800px"
    }}>
      <Tabs variant="fullWidth" value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
        <Tab label="Users" />
        <Tab label="Group chats" />
        <Tab label="Posts" />
      </Tabs>

      <Box>
        <Box hidden={tabIndex !== 0}>
          <UsersSearch userClickFunction={(user) => navigate(`/users/${user.username}`)}/>
        </Box>
        <Box hidden={tabIndex !== 1}>
          <GroupChatsSearch/>
        </Box>
        <Box hidden={tabIndex !== 2}>
          <PostsSearch/>
        </Box>
      </Box>

    </Paper>
  );
}