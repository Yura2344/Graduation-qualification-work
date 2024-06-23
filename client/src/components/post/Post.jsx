import { Comment, MoreVert, ThumbDown, ThumbUp } from "@mui/icons-material";
import { Avatar, Box, Button, Card, CardActions, CardContent, CardHeader, Collapse, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { enqueueSnackbar } from "notistack";
import moment from "moment";
import mime from "mime";
import getSymbolFromCurrency from "currency-symbol-map";

import { useUserContext } from "../user/UserContext";
import { axiosInstance } from "../../axios";
import AddComment from "../comment/CommentForm";
import PostDeleteDialog from "./PostDeleteDialog";
import PostComment from "../comment/PostComment";

export default function Post({ postData }) {
  const { user } = useUserContext();

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [comments, setComments] = useState();

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuAnchorElem, setMenuAnchorElem] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const navigate = useNavigate();

  function handleMenuOpen(event){
    setMenuAnchorElem(event.currentTarget);
  }

  function handleMenuClose(){
    setMenuAnchorElem(null);
  }

  async function sendReaction(reaction) {
    if (!user) {
      enqueueSnackbar("You must be logged in");
      return;
    }
    const data = new URLSearchParams();
    data.append("reaction", reaction)
    await axiosInstance.put(`/posts/${postData.id}/reaction`, data).then(async (res) => {
      await axiosInstance.get(`/posts/${postData.id}/reactions`).then((res2) => {
        setLikes(res2.data.like || 0);
        setDislikes(res2.data.dislike || 0);
      });
    })
  }

  async function getComments() {
    await axiosInstance.get(`/posts/${postData.id}/comments`).then((res) => {
      setCommentsCount(res.data.length);
      setComments(res.data);
    });
  }

  function copyPostLink(){
    navigator.clipboard.writeText(`${window.location.origin}/posts/${postData.id}`);
  }

  useEffect(() => {
    setLikes(postData?.reactions.like || 0);
    setDislikes(postData?.reactions.dislike || 0);
    setCommentsCount(postData?.commentsCount || 0);
  }, [postData]);

  return (
    <Card elevation={3} sx={{
      p: 2,
      width: "100%",
      minWidth: "400px",
      maxWidth: "800px"
    }}>
      <Menu
        anchorEl={menuAnchorElem}
        open={Boolean(menuAnchorElem)}
        onClose={handleMenuClose}
      >
        <MenuItem key={"copy-link"} onClick={copyPostLink}>Copy link</MenuItem>
        {
          postData?.creator.username === user?.username && 
          [
            <MenuItem key={"edit-post"} onClick={() => navigate(`/posts/${postData.id}/edit`)}>Edit post</MenuItem>,
            <MenuItem key={"delete-post"} onClick={() => setIsDeleteDialogOpen(true)}>Delete post</MenuItem>
          ]
        }
      </Menu>
      <PostDeleteDialog 
        postId={postData?.id} 
        isDeleteDialogOpen={isDeleteDialogOpen} 
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
      />
      <CardContent>
        <CardHeader sx={{ p: 0, paddingBottom: 3 }}
          avatar={<Avatar src={postData?.creator.avatarURL}></Avatar>}
          title={postData?.creator.username}
          action={
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          }
          subheader={`${moment(postData?.createdAt).format("DD.MM.YYYY")}${postData?.createdAt !== postData?.updatedAt ? "(edited)" : ""}`}
        />
        <Typography variant="h5">
          {postData?.advertisementData?.title} {postData?.advertisementData?.cost} {getSymbolFromCurrency(postData?.advertisementData?.currency)}
        </Typography>
        <Typography>
          {postData?.content}
        </Typography>
        {
          postData?.medias && postData?.medias.map((media) => {
            if(mime.getType(media.mediaURL).substring(0, 5) === "image")
              return (<img key={media.id} style={{ maxWidth: "50%" }} src={media.mediaURL} alt={media.mediaURL} />);
            else
              return (<video key={media.id} style={{ maxWidth: "50%" }} src={media.mediaURL} alt={media.mediaURL} controls></video>)
          })
        }
      </CardContent>
      <CardActions disableSpacing>
        <Button startIcon={<ThumbUp />} onClick={() => sendReaction("like")}>
          <Typography>{likes || 0}</Typography>
        </Button>
        <Button startIcon={<ThumbDown />} onClick={() => sendReaction("dislike")}>
          <Typography>{dislikes || 0}</Typography>
        </Button>
        <Button sx={{ ml: 'auto' }} startIcon={<Comment />} onClick={() => {
          setCommentsOpen((prev) => !prev);
          getComments();
        }}>
          <Typography>{commentsCount || 0}</Typography>
        </Button>
      </CardActions>
      <Collapse in={commentsOpen}>
        <CardContent>
          <Box display="flex" flexDirection="column" rowGap={2}>
            {
              user && <AddComment postId={postData?.id} updateComments={getComments} />
            }
            {
              comments && comments.map((comment) => (
                <PostComment key={comment.id} commentData={comment} updateComments={getComments}/>
              ))
            }
            {commentsCount === 0 && <Typography>No comments</Typography>}
          </Box>
        </CardContent>
      </Collapse>
    </Card>)
}