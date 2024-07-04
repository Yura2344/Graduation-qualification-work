import { useEffect, useState } from "react";
import { Avatar, Box, Card, CardContent, CardHeader, Link, Typography } from "@mui/material";
import moment from "moment";

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";
import { socket } from "../socket";

export default function Chats() {
  const {user, userLoading} = useUserContext();
  const [chats, setChats] = useState([]);

  async function getChats(){
    await axiosInstance.get(`/users/me/chats`).then(async (res) => {
      let chatsTemp = res.data;
      console.log(chatsTemp);
      chatsTemp.sort((a, b) => {return a.lastMessage && b.lastMessage ? new  Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt) : 1});
      setChats(chatsTemp);
    }).catch((err) => {
      console.log(err);
    });
  };

  useEffect(() => {
    getChats();
  }, []);

  useEffect(() => {
    function onCreatedChat(){
      getChats();
    }

    function onSentMessage(message){
      setChats((prev) => {
        prev[prev.findIndex((chat) => chat.id === message.chatId)].lastMessage = message;
        return [...prev];
      });
    }

    function onMessageDeleted(messageId, prevMessage){
      setChats((prev) => {
        prev[prev.findIndex((chat) => chat.id === prevMessage.chatId)].lastMessage = prevMessage;
        return [...prev];
      });
    }

    socket.on('sent_message', onSentMessage);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("created_chat", onCreatedChat);
    return () => {
      socket.off("message_deleted", onMessageDeleted);
      socket.off("created_chat", onCreatedChat);
      socket.off('sent_message', onSentMessage);
    }
  }, []);

  return (
    <Box>
      {
        !userLoading && chats.length > 0 ? 
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 2,
          width: "600px"
        }}>
          {
            chats.map((chat) => {
              let currentUser = chat.members.find((v) => v.username === user.username);
              let secondUser = chat.members[1 - chat.members.indexOf(currentUser)];

              let mediasLength = chat.lastMessage?.medias?.length;
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
                    chat.lastMessage && [
                      chat.lastMessage.medias && 
                      
                      <Typography key="last-message">{chat.lastMessage.sender.username}: {chat.lastMessage.content}</Typography>,
                      chat.lastMessage.medias?.length > 0 && <Typography key="media-count">{mediasLength} media {mediasLength === 1 ? "file" : "files"}</Typography>,
                      <Typography key="message-date" variant="caption">{moment(chat.lastMessage.createdAt).format("HH:mm-DD.MM.YYYY")}</Typography>,
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