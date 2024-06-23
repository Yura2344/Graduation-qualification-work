import { useState } from "react";
import { Button, Card, CardActions, CardContent, CardHeader, TextField } from "@mui/material";
import { useNavigate } from "react-router";

import { axiosInstance } from "../axios";

export default function AddGroupChat(){
  const navigate = useNavigate();

  const [chatName, setChatName] = useState("");

  const [chatNameErrMsg, setChatNameErrMsg] = useState("");

  function createChat(){
    let params = new URLSearchParams();
    params.append("name", chatName);
    axiosInstance.post("/chats/group", params).then((res) => {
      navigate(`/chats/${res.data.chatId}`);
    }).catch((err) => {
      if(err.response.status === 400){
        for(const error of err.response.data){
          if(error.path === "name") setChatNameErrMsg(error.msg)
        }
      }
      console.log(err);
    });
  }

  return (
    <Card elevation={3}>
      <CardHeader title="Create chat"/>
      <CardContent>
        <TextField 
          label="Chat name"
          error={chatNameErrMsg !== ""}
          helperText={chatNameErrMsg}
          value={chatName}
          onChange={(e) => {setChatName(e.target.value); setChatNameErrMsg("")}}
          />
      </CardContent>
      <CardActions>
        <Button variant="outlined" onClick={createChat}>Create chat</Button>
      </CardActions>
    </Card>
  );
}