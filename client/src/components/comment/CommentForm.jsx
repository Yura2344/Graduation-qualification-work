import { useEffect, useState } from "react";
import { Box, Card, CardContent, IconButton, TextField, Tooltip } from "@mui/material";
import { AddPhotoAlternate, Cancel, Send } from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import mime from "mime";

import { axiosInstance } from "../../axios";
import MediaBox from "../MediaBox";
import RemoveMediaButton from "../RemoveMediaButton";

export default function CommentForm({ edit = false, postId, setEdit, commentData, updateComments }) {
  
  const [content, setContent] = useState("");
  const [commentMedia, setCommentMedia] = useState([]);

  function removeMedia(index) {
    setCommentMedia((prev) => prev.filter((v, i) => i !== index));
  }

  function handleSelectedFiles(event) {
    const mediaArray = Array.from(event.target.files);
    if (commentMedia.length === 0) {
      if (event.target.files.length > 10) {
        const newMediaArray = mediaArray.slice(0, 10);
        for(let media of newMediaArray){
          media.displayURL = URL.createObjectURL(media);
        }
        setCommentMedia(newMediaArray);
        enqueueSnackbar("Files that exceed limit of 10 were rejected");
      } else {
        for(let media of mediaArray){
          media.displayURL = URL.createObjectURL(media);
        }
        setCommentMedia(mediaArray);
      }

    } else if (commentMedia.length === 10) {
      enqueueSnackbar("You already have max number of media files");

    } else if (commentMedia.length > 0) {
      if (commentMedia.length + event.target.files.length > 10) {
        const newMediaArray = mediaArray.slice(0, 10 - commentMedia.length);
        for(let media of newMediaArray){
          media.displayURL = URL.createObjectURL(media);
        }
        setCommentMedia((prev) => [...prev, ...newMediaArray]);
        enqueueSnackbar("Files that exceed limit of 10 were rejected");

      } else {
        for(let media of mediaArray){
          media.displayURL = URL.createObjectURL(media);
        }
        setCommentMedia((prev) => [...prev, ...mediaArray]);
      }
    }
  }

  function addComment() {
    const data = new FormData();
    data.append("content", content);
    if (commentMedia)
      for (let media of commentMedia) {
        data.append("media", media);
      }
    axiosInstance.post(`/posts/${postId}/comments`, data).then(async (res) => {
      setContent("");
      setCommentMedia([]);
      await updateComments();
    });
  }

  function editComment() {
    const data = new FormData();
    data.append("content", content);
    if (commentMedia.length > 0)
      for (let media of commentMedia) {
        data.append("media", media);
      }
    else
      data.append("removeMedias", true);
    axiosInstance.put(`/posts/${commentData.postId}/comments/${commentData.id}`, data).then(async (res) => {
      setContent("");
      setCommentMedia(null);
      setEdit(false);
      await updateComments();
    }).catch((err) => {
      enqueueSnackbar(err.response.data);
    });
  }

  useEffect(() => {
    if (edit) {
      setContent(commentData.content);
      async function setPostMediaFromURLs() {
        const mediaFiles = await Promise.all(commentData?.medias?.map(async (media) => {
          let response = await fetch(media.mediaURL);
          let data = await response.blob();
          let metadata = {
            type: mime.getType(media.mediaURL)
          };
          return new File([data], media.mediaURL.split("/").pop(), metadata);
        }));
        setCommentMedia(mediaFiles);
      }
      setPostMediaFromURLs();
    }
  }, [commentData, edit]);

  return (
    <Card sx={{ p: 1, maxWidth: "700px" }} elevation={3}>
      <CardContent sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 2
      }}>
        {
          commentMedia.length > 0 &&
          <Box display="flex" alignItems="flex-start" flexWrap="wrap">
            {
              commentMedia.map((media, index) => {
                if (media.type.substring(0, 5) === "image") {
                  return (<MediaBox key={index}>
                    <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                    <img style={{ maxWidth: "100%" }}
                      src={URL.createObjectURL(media)}
                      alt={media.name} />
                  </MediaBox>)
                } else {
                  return (
                    <MediaBox key={index}>
                      <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                      <video style={{ maxWidth: "100%", }}
                        src={URL.createObjectURL(media)}
                        alt={media.name}
                        controls
                      />
                    </MediaBox>
                  );
                }

              })
            }
          </Box>
        }

        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <TextField
            value={content}
            onChange={(e) => setContent(e.target.value)}
            label="Write comment"
            multiline
            maxRows={10}
            fullWidth
          />
          {
              edit && 
                <Tooltip title="Cancel edit">
                  <IconButton onClick={() => setEdit(false)}>
                    <Cancel/>
                  </IconButton>
                </Tooltip>
            }
          <Tooltip title="Upload files">
            <IconButton component="label">
              <AddPhotoAlternate />
              <input type="file" accept="image/*, video/*" multiple hidden onInput={handleSelectedFiles} />
            </IconButton>
          </Tooltip>
          <Tooltip title={edit ? "Edit comment" : "Send comment"}>
            <IconButton onClick={edit ? editComment : addComment}>
              <Send />
            </IconButton>
          </Tooltip>
        </Box>

      </CardContent>
    </Card>
  );
}