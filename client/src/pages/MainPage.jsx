import { useState } from "react";
import { Box, Paper, Tab, Tabs } from "@mui/material";

import Posts from "./Posts";
import FollowingPosts from "./FollowingsPosts";

export default function MainPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Paper sx={{
      p: 2,
      height: "100%",
      width: "100%",
      maxWidth: "800px"
    }}>
      <Tabs variant="fullWidth" value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
        <Tab label="All posts" />
        <Tab label="Followings posts" />
      </Tabs>
      <Box>
        <Box hidden={tabIndex !== 0}>
          <Posts />
        </Box>
        <Box hidden={tabIndex !== 1}>
          <FollowingPosts />
        </Box>
      </Box>
    </Paper>
  )
}