import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import ReactCrop, { makeAspectCrop } from "react-image-crop";

import { socket } from "../../socket";

export default function ChangeChatAvatarDialog({open, setIsOpen, chatId}){

  const [crop, setCrop] = useState();
  const imgRef = useRef();

  const [newAvatarFile, setNewAvatarFile] = useState();
  const [newAvatarURL, setNewAvatarURL] = useState("");
  const [newAvatarWidth, setNewAvatarWidth] = useState(200);
  const [newAvatarHeight, setNewAvatarHeight] = useState(200);
  const [newAvatarNaturalWidth, setNewAvatarNaturalWidth] = useState(200);
  const [newAvatarNaturalHeight, setNewAvatarNaturalHeight] = useState(200);

  function handleImageInput(e) {
    setNewAvatarFile(e.target.files?.[0]);
    setNewAvatarURL(URL.createObjectURL(e.target.files?.[0]));
  }

  function handleImageLoad(e) {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth < 200 || naturalHeight < 200) {
      setNewAvatarURL("");
      setNewAvatarFile(null);
      enqueueSnackbar("Image should be at least 200x200 pixels");
      return;
    }

    setNewAvatarNaturalWidth(naturalWidth);
    setNewAvatarNaturalHeight(naturalHeight);
    setNewAvatarWidth(width);
    setNewAvatarHeight(height);
    const newCrop = makeAspectCrop({
      unit: "px",
      width: 100
    }, 1, naturalWidth, naturalHeight);
    setCrop(newCrop);
  }

  async function changeAvatar() {
    let scale = 1;
    if(newAvatarNaturalWidth > newAvatarNaturalHeight){
      scale = newAvatarNaturalWidth / newAvatarWidth;
    }else{
      scale = newAvatarNaturalHeight / newAvatarHeight;
    }

    const fileToSend = {
      name: newAvatarFile.name,
      type: newAvatarFile.type,
      data: newAvatarFile
    };

    const cropParams = {
      cropX: scale * crop.x, 
      cropY: scale * crop.y, 
      cropWidth: scale * crop.width, 
      cropHeight: scale * crop.height
    };
    socket.emit("update_chat_avatar", chatId, fileToSend, cropParams);
    setIsOpen(false);
  }

  return (
    <Dialog onClose={() => setIsOpen(false)} open={open}>
        <DialogTitle>Set avatar</DialogTitle>
        <DialogContent sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          rowGap: 2
        }}>
          {
            newAvatarFile &&
            <ReactCrop
              crop={crop}
              onChange={(pixelCrop, percentageCrop) => setCrop(pixelCrop)}
              circularCrop
              keepSelection
              aspect={1}
              minWidth={100}
              minHeight={100}
            >
              <img crossOrigin="anonymous" ref={imgRef} src={newAvatarURL} alt="Upload avatar" onLoad={handleImageLoad} />
            </ReactCrop>
          }

          <Button variant="contained" component="label">
            Upload image
            <input type="file" accept="image/*" hidden onInput={handleImageInput} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button disabled={!newAvatarFile} variant="contained" onClick={changeAvatar}>Apply</Button>
          <Button variant="outlined" onClick={() => setIsOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
  );
}