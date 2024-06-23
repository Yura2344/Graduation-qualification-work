import { Search } from "@mui/icons-material";
import { Avatar, Box, Button, Card, CardHeader, Paper, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { axiosInstance } from "../../axios";

export default function UsersSearch({ userClickFunction }) {
  const [username, setUsername] = useState("");

  const [users, setUsers] = useState([]);

  function searchUsers() {
    axiosInstance.get(`/users?username=${username}`).then((res) => {
      setUsers(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
    axiosInstance.get(`/users`).then((res) => {
      setUsers(res.data);
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
        <TextField value={username} onChange={(e) => setUsername(e.target.value)} label="Enter username" />
        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={searchUsers}
        >
          Search
        </Button>
      </Paper>
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 2
      }}>
        {
          users.length > 0 && users.map((user) => (
            <Card key={user.id}>
              {
                <CardHeader sx={{cursor: "pointer"}} onClick={() => userClickFunction(user)}
                  avatar={<Avatar src={user.avatarURL} />}
                  title={user.username}
                /> 
              }


            </Card>))

        }
      </Box>
    </Box>
  );
}