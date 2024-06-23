import { Search } from "@mui/icons-material";
import { Avatar, Box, Button, Card, CardHeader, Link, Paper, TextField } from "@mui/material";
import { useEffect, useState } from "react";

import { axiosInstance } from "../../axios";

export default function GroupChatsSearch(){
  const [chatname, setChatname] = useState("");

  const [chats, setChats] = useState([]);

  function searchChats(){
    axiosInstance.get(`/chats?name=${chatname}`).then((res) => {
      setChats(res.data);
    }).catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
    axiosInstance.get(`/chats`).then((res) => {
      setChats(res.data);
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
      <Paper sx={{p: 1, display: "flex", flexDirection: "column", rowGap: 2, alignItems: "flex-start"}}>
        <TextField value={chatname} onChange={(e) => setChatname(e.target.value)} label="Search chat name"/>
        <Button 
          variant="contained" 
          startIcon={<Search/>}
          onClick={searchChats}
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
          chats.length > 0 && chats.map((chat) => (
          <Card key={chat.id}>
            <Link href={`/chats/${chat.id}`} underline="none" color="text.primary">
              <CardHeader 
                avatar={<Avatar src={chat.avatarURL}/>}
                title={chat.name}
              />
            </Link>
            
          </Card>))
          
        }
      </Box>
    </Box>
  );
}