import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Card, CardContent, CardHeader, IconButton, Menu, MenuItem, Paper, TextField, Tooltip } from "@mui/material";
import { AddPhotoAlternate, Cancel, MoreVert, Send } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import mime from "mime";

import { useUserContext } from "../components/user/UserContext.jsx";
import { axiosInstance } from "../axios";
import { socket } from "../socket.js"
import MediaBox from "../components/MediaBox.jsx";
import RemoveMediaButton from "../components/RemoveMediaButton.jsx";
import Message from "../components/chat/Message.jsx";
import ChatMembersDialog from "../components/chat/ChatMembersDialog.jsx";
import AddMemberDialog from "../components/chat/AddMemberDialog.jsx";
import LeaveChatDialog from "../components/chat/LeaveChatDialog.jsx";
import DeleteChatDialog from "../components/chat/DeleteChatDialog.jsx";
import EditChatDialog from "../components/chat/EditChatDialog.jsx";

export default function Chat() {
  const { user, userLoading } = useUserContext();
  const { chatId } = useParams();

  const navigate = useNavigate();

  const chatRef = useRef();

  const [chat, setChat] = useState();
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);

  const [messageMedia, setMessageMedia] = useState([]);
  const [content, setContent] = useState("");

  const [messageIdToEdit, setMessageIdToEdit] = useState(false);

  const [menuAnchorElem, setMenuAnchorElem] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isLeaveChatDialogOpen, setIsLeaveChatDialogOpen] = useState(false);
  const [isDeleteChatDialogOpen, setIsDeleteChatDialogOpen] = useState(false);
  const [isEditChatDialogOpen, setIsEditChatDialogOpen] = useState(false);

  async function setEditMessage(messageData) {
    setMessageIdToEdit(messageData.id);
    setContent(messageData.content);

    async function setPostMediaFromURLs() {
      const mediaFiles = await Promise.all(messageData.medias.map(async (media) => {
        let response = await axiosInstance.get(media.mediaURL, {
          responseType: "blob"
        });
        let data = await response.data;
        let metadata = {
          type: mime.getType(media.mediaURL)
        };
        let file = new File([data], media.mediaURL.split("/").pop(), metadata);
        file.displayURL = URL.createObjectURL(file);
        return file;
      }));
      setMessageMedia(mediaFiles);
    }
    await setPostMediaFromURLs();
  }

  function removeMedia(index) {
    setMessageMedia((prev) => prev.filter((v, i) => i !== index));
  }

  function handleSelectedFiles(event) {
    const mediaArray = Array.from(event.target.files);
    if (messageMedia.length === 0) {
      if (event.target.files.length > 10) {
        const newMediaArray = mediaArray.slice(0, 10);
        for (let media of newMediaArray) {
          media.displayURL = URL.createObjectURL(media);
        }
        setMessageMedia(newMediaArray);
        enqueueSnackbar("Files that exceed limit of 10 were rejected");
      } else {
        for (let media of mediaArray) {
          media.displayURL = URL.createObjectURL(media);
        }
        setMessageMedia(mediaArray);
      }

    } else if (messageMedia.length === 10) {
      enqueueSnackbar("You already have max number of media files");

    } else if (messageMedia.length > 0) {
      if (messageMedia.length + event.target.files.length > 10) {
        const newMediaArray = mediaArray.slice(0, 10 - messageMedia.length);
        for (let media of newMediaArray) {
          media.displayURL = URL.createObjectURL(media);
        }
        setMessageMedia((prev) => [...prev, ...newMediaArray]);
        enqueueSnackbar("Files that exceed limit of 10 were rejected");

      } else {
        for (let media of mediaArray) {
          media.displayURL = URL.createObjectURL(media);
        }
        setMessageMedia((prev) => [...prev, ...mediaArray]);
      }
    }
  }

  function sendMessage() {
    let filesToSend = [];
    for (const media of messageMedia) {
      filesToSend.push({
        name: media.name,
        type: media.type,
        data: media
      });
    }
    if (messageIdToEdit) {
      socket.emit("edit_message", messageIdToEdit, content, filesToSend);
      setMessageIdToEdit(null);
    } else {
      socket.emit("send_message", chatId, content, filesToSend);
    }
    setMessageMedia([]);
    setContent("");
  }

  function cancelEdit() {
    setMessageIdToEdit(null);
    setContent("");
    setMessageMedia([]);
  }

  useEffect(() => {
    if (!user) return;
    async function getChat() {
      await axiosInstance.get(`/chats/${chatId}`).then(async (res) => {
        let chatTemp = res.data;
        const { id, chatType, creatorId, name, avatarURL, createdAt, updatedAt } = chatTemp;
        setChat({ id, chatType, creatorId, name, avatarURL, createdAt, updatedAt });
        setMembers(chatTemp.members);
        await axiosInstance.get(`/chats/${chatId}/messages`).then((res) => {
          setMessages(res.data);
        }).catch((err) => {
          console.log(err)
        });
      }).catch((err) => {
        console.log(err);
      });
    }
    getChat();
  }, [chatId, user]);

  useEffect(() => {
    chatRef.current.scroll({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function getMessage(message) {
    setMessages((prev) => [...prev, message]);
  }

  function joinChat() {
    socket.emit("join_chat", chatId);
  }

  useEffect(() => {
    if (userLoading) return;
    function updateReactions(messageId, reactions) {

      setMessages((prev) => prev.map((m) => {
        if (m.id === messageId) {
          m.reactions = reactions;
          return m;
        } else return m;
      }));
    }

    function updateMessage(message) {
      setMessages((prev) => prev.map((m) => {
        if (m.id === message.id) {
          return message;
        } else return m;
      }));
    }

    function deleteMessage(messageId) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }

    function emptyMessage() {
      enqueueSnackbar("Message should have at least either media or text");
    }

    function updateMembers(newMember) {
      setMembers((prev) => [...prev, newMember])
    }

    function onLeftChat() {
      navigate("/chats");
    }

    socket.on('sent_message', getMessage);
    socket.on('update_reactions', updateReactions);
    socket.on('update_message', updateMessage);
    socket.on('message_deleted', deleteMessage);
    socket.on('added_member', updateMembers);
    socket.on('empty_message', emptyMessage);
    socket.on("left_chat", onLeftChat);
  
    return () => {
      socket.off('sent_message', getMessage);
      socket.off('update_reactions', updateReactions);
      socket.off('update_message', updateMessage);
      socket.off('message_deleted', deleteMessage);
      socket.off('added_member', updateMembers);
      socket.off('empty_message', emptyMessage);
      socket.off("left_chat", onLeftChat);
    }
  }, [chatId, navigate, userLoading]);

  useEffect(() => {
    async function onUpdateChat(){
      await axiosInstance.get(`/chats/${chatId}`).then(async (res) => {
        let chatTemp = res.data;
        const { id, chatType, creatorId, name, avatarURL, createdAt, updatedAt } = chatTemp;
        setChat({ id, chatType, creatorId, name, avatarURL, createdAt, updatedAt });
      }).catch((err) => {
        console.log(err);
      });
    }
    socket.on("updated_chat", onUpdateChat);
    return () => {
      socket.off("updated_chat", onUpdateChat);
    }
  }, [chatId]);

  useEffect(() => {
    console.log(members);
    console.log(user);
    if (user && chat && !members.some((m) => m.id === user.id)) {
      console.log("connect not member");
      socket.emit("connect_to_chat", chatId);
    }
    return () => {
      if (user && chat && !members.some((m) => m.id === user.id)) {
        console.log("disconnect not member", user.id);
        socket.emit("disconnect_from_chat", chatId);
      }
    }
  }, [chat, chatId, members, user]);

  return (
    <Card elevation={3} sx={{
      minWidth: "600px",
      maxWidth: "1000px",
      height: "650px"
    }}>
      <Menu open={Boolean(menuAnchorElem)} anchorEl={menuAnchorElem} onClose={() => setMenuAnchorElem(null)}>
        {
          chat?.chatType === "group" && [
            <MenuItem key="members" onClick={() => setIsMembersDialogOpen(true)}>Members</MenuItem>,
            chat?.creatorId === user.id && <MenuItem key="add-member" onClick={() => setIsAddMemberDialogOpen(true)}>Add member</MenuItem>,
            chat?.creatorId === user.id && <MenuItem key="edit-chat" onClick={() => setIsEditChatDialogOpen(true)}>Edit chat</MenuItem>,
            (chat?.creatorId !== user.id && members.some((m) => m.id === user.id)) && <MenuItem key="leave-chat" onClick={() => setIsLeaveChatDialogOpen(true)}>Leave chat</MenuItem>,
            chat?.creatorId === user.id && <MenuItem key="delete-chat" onClick={() => setIsDeleteChatDialogOpen(true)}>Delete chat</MenuItem>
          ]
        }
      </Menu>
      <ChatMembersDialog open={isMembersDialogOpen} setIsOpen={setIsMembersDialogOpen} members={members}/>
      <AddMemberDialog open={isAddMemberDialogOpen} setIsOpen={setIsAddMemberDialogOpen} chatId={chatId}/>
      <LeaveChatDialog open={isLeaveChatDialogOpen} setIsOpen={setIsLeaveChatDialogOpen} chatId={chatId}/>
      <DeleteChatDialog open={isDeleteChatDialogOpen} setIsOpen={setIsDeleteChatDialogOpen} chatId={chatId}/>
      <EditChatDialog open={isEditChatDialogOpen} setIsOpen={setIsEditChatDialogOpen} chatId={chatId}/>
      <CardHeader avatar={
        <Avatar src={
          chat?.chatType === "personal" ? members[1 - members.indexOf(members.find((v) => v.username === user?.username))]?.avatarURL : chat?.avatarURL
        }
        />}
        title={chat?.chatType === "personal" ? members[1 - members.indexOf(members.find((v) => v.username === user?.username))]?.username : chat?.name}
        action={
          <IconButton onClick={(e) => setMenuAnchorElem(e.target)}>
            <MoreVert />
          </IconButton>}
      />
      <CardContent sx={{
        height: "80%",
        display: "flex",
        flexDirection: "column",
        rowGap: 2,
        overflowY: "auto"
      }}>
        <Paper ref={chatRef} elevation={3} sx={{
          height: "100%",
          minHeight: "300px",
          maxHeight: "400px",
          overflowY: "auto",
          p: 3,
          rowGap: 2
        }}>
          {
            messages.length > 0 && messages.map((message) => (
              <Message key={message.id} messageData={message} isGroupChat={chat?.chatType === "group"} isMyMessage={message.senderId === user.id} setEditMessage={setEditMessage} />
            ))
          }
        </Paper>
        {
          !members.some((m) => m.id === user.id) ?
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Button variant="outlined" onClick={joinChat}>Join chat</Button>
            </Box> :
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Box sx={{
                display: "flex"
              }}>
                <TextField
                  label="Enter message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  multiline
                  maxRows={5}
                  sx={{
                    flexGrow: 1
                  }}
                />
                {
                  messageIdToEdit &&
                  <Tooltip title="Cancel edit">
                    <IconButton onClick={cancelEdit}>
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                }
                <Tooltip title="Upload files">
                  <IconButton component="label">
                    <AddPhotoAlternate />
                    <input type="file" accept="image/*, video/*" multiple hidden onInput={handleSelectedFiles} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={messageIdToEdit ? "Edit message" : "Send message"}>
                  <IconButton onClick={sendMessage}>
                    <Send />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box display="flex" alignItems="flex-start" flexWrap="wrap">
                {
                  messageMedia && messageMedia.map((media, index) => {
                    if (media.type.substring(0, 5) === "image") {
                      return (<MediaBox key={index}>
                        <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                        <img style={{ maxWidth: "100%" }}
                          src={media.displayURL}
                          alt={media.name} />
                      </MediaBox>)
                    } else {
                      return (
                        <MediaBox key={index}>
                          <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                          <video style={{ maxWidth: "100%", }}
                            src={media.displayURL}
                            alt={media.name}
                            controls
                          />
                        </MediaBox>
                      );
                    }

                  })
                }
              </Box>
            </Box>
        }
      </CardContent>
    </Card>);
}