import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export default function RemoveMediaButton({removeFunc}) {
  return (
    <IconButton
      sx={{
        color: "white",
        position: "absolute",
        zIndex: 10
      }}
      onClick={removeFunc}
    >
      <Delete sx={{ color: (theme) => theme.primary }} />
    </IconButton>
  );
}