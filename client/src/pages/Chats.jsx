import { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, CardHeader, Link, Typography } from "@mui/material";
import moment from "moment";

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";

export default function Chats() {
  const {user} = useUserContext();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    async function getChats(){
      await axiosInstance.get(`/users/me/chats`).then(async (res) => {
        let chatsTemp = res.data;
        for(let chat of chatsTemp){
          await axiosInstance.get(`/chats/${chat.id}/messages?limit=1`).then((res2) => {
            chat.lastMessage = res2.data[0];
          }).catch((err) => {
            console.log(err);
          });
        }
        setChats(chatsTemp);
      }).catch((err) => {
        console.log(err);
      });
    };
    getChats();
  }, []);

  return (
    <Box>
      {
        chats.length > 0 ? 
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 2,
          width: "600px"
        }}>
          {
            chats.length > 0 && chats.map((chat) => {
              let currentUser = chat.members.find((v) => v.username === user.username);
              let secondUser = chat.members[1 - chat.members.indexOf(currentUser)];
              return (
              <Card key={chat.id} elevation={3}>
                {
                  <Link href={`/chats/${chat.id}`} underline="none" color="text.primary">
                  <CardHeader avatar={<Avatar 
                    src={chat.chatType === "personal" ? secondUser.avatarURL : chat.avatarURL}
                  />} title={chat.chatType === "personal" ? secondUser.username : chat.name}/>
                  </Link>
                }
                <CardContent>
                  {
                    chat.lastMessage && [<Typography>{chat.lastMessage.sender.username}: {chat.lastMessage.content}</Typography>,
                      <Typography variant="caption">{moment(chat.lastMessage.createdAt).format("HH:mm-DD.MM.YYYY")}</Typography>
                    ]
                  }
                </CardContent>
              </Card>)
            })
          }
        </Box> : 
        <Typography>No chats</Typography>
      }
    </Box>
  );
}