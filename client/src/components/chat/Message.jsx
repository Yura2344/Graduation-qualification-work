import { useState } from "react";
import { Avatar, Box, Button, Card, CardContent, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { MoreVert, ThumbDown, ThumbUp } from "@mui/icons-material";
import moment from "moment";
import mime from "mime";

import { useUserContext } from "../user/UserContext";
import { socket } from "../../socket";
import MessageDeleteDialog from "./MessageDeleteDialog";

export default function Message({ messageData, isGroupChat = false, isMyMessage, setEditMessage }) {
  const { user } = useUserContext();

  const [menuAnchorElem, setMenuAnchorElem] = useState(false);
  const [isMessageDeleteDialogOpen, setIsMessageDeleteDialogOpen] = useState(false);

  function sendReaction(reaction) {
    socket.emit("set_message_reaction", messageData.id, reaction);
  }

  function deleteMessage() {
    setIsMessageDeleteDialogOpen(true);
    setMenuAnchorElem(null);
  }

  return (
    <Card elevation={3} sx={{
      width: "fit-content",
      maxWidth: "70%",
      marginTop: "8px",
      marginBottom: "8px",
      marginLeft: isMyMessage ? "auto" : "none"
    }}>
      <Menu open={Boolean(menuAnchorElem)} anchorEl={menuAnchorElem} onClose={() => setMenuAnchorElem(null)}>
        {
          user.id === messageData.senderId && [
            <MenuItem key="edit_message" onClick={() => {setEditMessage(messageData); setMenuAnchorElem(null)}}>Edit message</MenuItem>,
            <MenuItem key="delete_message" onClick={deleteMessage}>Delete message</MenuItem>
          ]
        }
      </Menu>
      <MessageDeleteDialog messageId={messageData.id} isDeleteDialogOpen={isMessageDeleteDialogOpen} setIsDeleteDialogOpen={setIsMessageDeleteDialogOpen}/>
      <CardContent sx={{ display: "flex", alignItems: "flex-start", columnGap: 1 }}>
        {
          isGroupChat && !isMyMessage && <Avatar src={messageData.sender.avatarURL} sx={{width: 30, height: 30}}/>
        }
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {
            isGroupChat && !isMyMessage && <Typography variant="caption">{messageData.sender.username}</Typography>
          }
          
          <Typography sx={{wordWrap: "break-word", maxWidth: "250px"}}>{messageData.content}</Typography>
          {
            messageData?.medias.length > 0 &&
            <Box sx={{
              display: "flex",
              flexWrap: "wrap"
            }}>
              {
                messageData?.medias.map((media) => {
                  if (mime.getType(media.mediaURL).substring(0, 5) === "image")
                    return (<img key={media.id} style={{ maxWidth: "100%" }} src={media.mediaURL} alt={media.mediaURL} />);
                  else
                    return (<video key={media.id} style={{ maxWidth: "100%" }} src={media.mediaURL} alt={media.mediaURL} controls></video>)
                })
              }
            </Box>
          }

          <Box>
            <Button startIcon={<ThumbUp />} onClick={() => sendReaction("like")}>
              <Typography>{messageData?.reactions?.like || 0}</Typography>
            </Button>
            <Button startIcon={<ThumbDown />} onClick={() => sendReaction("dislike")}>
              <Typography>{messageData?.reactions?.dislike || 0}</Typography>
            </Button>
            <Typography sx={{ marginLeft: "auto" }} variant="caption">{`${moment(messageData.createdAt).format("HH:mm-DD.MM.YYYY")}${messageData.createdAt !== messageData.updatedAt ? "(edited)" : ""}`}</Typography>
          </Box>
        </Box>
        <IconButton onClick={(e) => setMenuAnchorElem(e.target)}>
          <MoreVert />
        </IconButton>

      </CardContent>
    </Card>
  );
}