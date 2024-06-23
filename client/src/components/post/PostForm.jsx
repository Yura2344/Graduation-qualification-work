import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CardHeader, MenuItem, TextField, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router";
import mime from "mime";

import { axiosInstance } from "../../axios";
import MediaBox from "../MediaBox";
import RemoveMediaButton from "../RemoveMediaButton";
import { useUserContext } from "../user/UserContext";

export default function PostForm({ edit = false, postData }) {
  const { user, userLoading } = useUserContext();
  const [postMedia, setPostMedia] = useState([]);
  const [content, setContent] = useState("");

  const [postType, setPostType] = useState("regular");
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(1);
  const [currency, setCurrency] = useState("UAH");

  const [contentErrorMessage, setContentErrorMessage] = useState("");
  const [titleErrorMessage, setTitleErrorMessage] = useState("");
  const [costErrorMessage, setCostErrorMessage] = useState("");
  const [currencyErrorMessage, setCurrencyErrorMessage] = useState("");

  function removeMedia(index) {
    setPostMedia((prev) => prev.filter((v, i) => i !== index));
  }

  function handleCurrencyChange(event) {
    setCurrency(event.target.value);
    setCurrencyErrorMessage("");
  }

  const navigate = useNavigate();

  function handleSelectedFiles(event) {
    let mediaArray = Array.from(event.target.files);
    if (postMedia.length === 0) {
      if (event.target.files.length > 10) {
        setPostMedia(mediaArray.slice(0, 10));
        enqueueSnackbar("Files that exceed limit of 10 were rejected");
      } else {
        setPostMedia(mediaArray);
      }
    } else if (postMedia.length === 10) {
      enqueueSnackbar("You already have max number of media files");
    } else if (postMedia.length > 0) {
      if (postMedia.length + event.target.files.length > 10) {
        setPostMedia((prev) => [...prev, ...(mediaArray.slice(0, 10 - postMedia.length))]);
        enqueueSnackbar("Files that exceed limit of 10 were rejected");
      } else {
        setPostMedia((prev) => [...prev, ...mediaArray]);
      }
    }
  }

  function addPost() {
    const data = new FormData();
    data.append("content", content);
    data.append("type", postType);
    if (postType === "advertisement") {
      data.append("title", title);
      data.append("cost", cost);
      data.append("currency", currency);
    }
    if (postMedia)
      for (let media of postMedia) {
        data.append("media", media);
      }
    axiosInstance.post(`/posts/`, data).then(async (res) => {
      setContent("");
      setPostMedia(null);
      enqueueSnackbar("Successfully created post");
      navigate(`/posts/${res.data.postId}`);
    }).catch((err) => {
      console.log(err);
      if (err.response.status === 400) {
        for (const error of err.response.data) {
          if (error.path === "content") {
            setContentErrorMessage(error.msg);
          }
          if (error.path === "title") {
            setTitleErrorMessage(error.msg);
          }
          if (error.path === "cost") {
            setCostErrorMessage(error.msg);
          }
        }
      }
    });
  }

  function editPost() {
    const data = new FormData();
    data.append("content", content);
    data.append("type", postType);
    if (postType === "advertisement") {
      title && data.append("title", title);
      cost && data.append("cost", cost);
      currency && data.append("currency", currency);
    }
    if (postMedia.length > 0)
      for (let media of postMedia) {
        if (!media.id)
          data.append("media", media);
      }
    else
      data.append("removeMedias", true);
    axiosInstance.put(`/posts/${postData.id}`, data).then(async (res) => {
      setContent("");
      setPostMedia(null);
      enqueueSnackbar("Successfully edited post");
      navigate(`/posts/${postData.id}`, { replace: true });
    }).catch((err) => {
      console.log(err);
      if (err.response.status === 400) {
        for (let error of err.response.data) {
          if (error.path === "content") {
            setContentErrorMessage(error.msg);
          }
          if (error.path === "title") {
            setTitleErrorMessage(error.msg);
          }
          if (error.path === "cost") {
            setCostErrorMessage(error.msg);
          }
        }
      }
    });
  }

  useEffect(() => {
    if(userLoading) return;
    if (edit) {
      setContent(postData.content);
      if (postData.advertisementData) {
        setPostType("advertisement");
        setTitle(postData.advertisementData.title);
        setCost(postData.advertisementData.cost);
        setCurrency(postData.advertisementData.currency);
      }
      async function setPostMediaFromURLs() {
        const mediaFiles = await Promise.all(postData?.medias?.map(async (media) => {
          let response = await fetch(media.mediaURL);
          let data = await response.blob();
          let metadata = {
            type: mime.getType(media.mediaURL)
          };
          return new File([data], media.mediaURL.split("/").pop(), metadata);
        }));
        setPostMedia(mediaFiles);
      }
      setPostMediaFromURLs();
    }
  }, [edit, postData, userLoading]);

  return (
    !userLoading && 
    (user ?
      <Card elevation={3} sx={{
        p: 2,
        width: "100%",
        minWidth: "400px",
        maxWidth: "800px",

      }}
      >
        <CardHeader title={edit ? "Edit post" : "Add post"} />
        <CardContent sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 2
        }}>
          <TextField
            error={contentErrorMessage !== ""}
            helperText={contentErrorMessage}
            value={content}
            onChange={(e) => { setContent(e.target.value); setContentErrorMessage("") }}
            label="Write post"
            multiline
            rows={10}
            fullWidth
          />
          <TextField select label="Post type" onChange={(e) => setPostType(e.target.value)} value={postType}>
            <MenuItem value="regular">Regular</MenuItem>
            <MenuItem value="advertisement">Advertisement</MenuItem>
          </TextField>
          {
            postType === "advertisement" && <Box sx={{
              display: "flex",
              alignItems: "flex-start",
              columnGap: 1
            }}>
              <TextField
                error={titleErrorMessage !== ""}
                helperText={titleErrorMessage}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setTitleErrorMessage("") }}
                label="Product title" />
              <TextField
                error={costErrorMessage !== ""}
                helperText={costErrorMessage}
                value={cost}
                onChange={(e) => { setCost(e.target.value); setCostErrorMessage("") }}
                type="number"
                label="Product cost"
              />
              <TextField select label="Currency" error={currencyErrorMessage !== ""} helperText={currencyErrorMessage} onChange={handleCurrencyChange} value={currency}>
                <MenuItem value="UAH">UAH</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Box>
          }
          <Button variant="outlined" component="label">
            Upload files
            <input type="file" accept="image/*, video/*" multiple hidden onInput={handleSelectedFiles} />
          </Button>
          <Box display="flex" alignItems="flex-start" flexWrap="wrap">
            {
              postMedia && postMedia.map((media, index) => {
                if (media.type.substring(0, 5) === "image") {
                  return (
                    <MediaBox key={index}>
                      <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                      <img style={{ maxWidth: "100%" }}
                        src={URL.createObjectURL(media)}
                        alt={media.name} />
                    </MediaBox>
                  )
                } else {
                  return (
                    <MediaBox key={index}>
                      <RemoveMediaButton removeFunc={() => removeMedia(index)} />
                      <video style={{ maxWidth: "100%" }}
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

          <Box>
            <Button variant="contained" onClick={edit ? editPost : addPost}>{edit ? "Edit post" : "Add post"}</Button>
            {
              edit && <Button onClick={() => navigate(-1)}>Cancel editing</Button>
            }
          </Box>
        </CardContent>
      </Card>
    : <Typography>You must be logged in to create post</Typography>)
  );
}