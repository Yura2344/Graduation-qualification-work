import { useState } from "react";
import { MoreVert, ThumbDown, ThumbUp } from "@mui/icons-material";
import { Avatar, Button, Card, CardActions, CardContent, CardHeader, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import moment from "moment";
import mime from "mime";

import { axiosInstance } from "../../axios";
import { useUserContext } from "../user/UserContext";
import CommentForm from "./CommentForm";
import CommentDeleteDialog from "./CommentDeleteDialog";

export default function PostComment({ commentData, updateComments }) {
  const { user } = useUserContext();

  const [likes, setLikes] = useState(commentData.reactions.like || 0);
  const [dislikes, setDisikes] = useState(commentData.reactions.dislike || 0);

  const [menuAnchorElem, setMenuAnchorElem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [edit, setEdit] = useState(false);

  function handleMenuOpen(event) {
    setMenuAnchorElem(event.currentTarget);
  }

  function handleMenuClose() {
    setMenuAnchorElem(null);
  }

  async function sendReaction(reaction) {
    if (!user) {
      enqueueSnackbar("You must be logged in");
      return;
    }
    const data = new URLSearchParams();
    data.append("reaction", reaction)
    await axiosInstance.put(`/posts/${commentData.postId}/comments/${commentData.id}/reaction`, data).then(async (res) => {
      await axiosInstance.get(`/posts/${commentData.postId}/comments/${commentData.id}/reactions`).then((res2) => {
        setLikes(res2.data.like || 0);
        setDisikes(res2.data.dislike || 0);
      });
    })
  }

  return (
    edit ? <CommentForm edit={true} setEdit={setEdit} commentData={commentData} updateComments={updateComments} /> : 
    <Card elevation={3} sx={{
      p: 1,
      minWidth: "300px",
      maxWidth: "700px"
    }}>
      <Menu
        anchorEl={menuAnchorElem}
        open={Boolean(menuAnchorElem)}
        onClose={handleMenuClose}
      >
        {
          commentData?.author.username === user?.username &&
          [
            <MenuItem key={"edit-post"} onClick={() => {setEdit(true); setMenuAnchorElem(null);}}>Edit comment</MenuItem>,
            <MenuItem key={"delete-post"} onClick={() => setIsDeleteDialogOpen(true)}>Delete comment</MenuItem>
          ]
        }
      </Menu>
      <CommentDeleteDialog 
        postId={commentData.postId}
        commentId={commentData.id} 
        isDeleteDialogOpen={isDeleteDialogOpen} 
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        updateComments={updateComments}
      />
      <CardContent>
        <CardHeader sx={{ p: 0, paddingBottom: 3 }}
          avatar={<Avatar src={commentData.author.avatarURL} />}
          title={commentData.author.username}
          action={
            <IconButton  onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          }
          subheader={`${moment(commentData.createdAt).format("DD.MM.YYYY")}${commentData.createdAt !== commentData.updatedAt ? "(edited)" : ""}`}
        />
        <Typography>
          {commentData.content}
        </Typography>
        {
          commentData.medias && commentData.medias.map((media) => {
            if(mime.getType(media.mediaURL).substring(0, 5) === "image")
              return (<img key={media.id} style={{ maxWidth: "50%" }} src={media.mediaURL} alt={media.mediaURL} />);
            else
              return (<video key={media.id} style={{ maxWidth: "50%" }} src={media.mediaURL} alt={media.mediaURL} controls></video>)
          })
        }
      </CardContent>,
      <CardActions disableSpacing>
        <Button startIcon={<ThumbUp />} onClick={() => sendReaction("like")}>
          <Typography>{likes || 0}</Typography>
        </Button>
        <Button startIcon={<ThumbDown />} onClick={() => sendReaction("dislike")}>
          <Typography>{dislikes || 0}</Typography>
        </Button>
      </CardActions>
    </Card>)
}