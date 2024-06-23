import { Box } from "@mui/material";

export default function MediaBox({children}){
  return (
    <Box 
      sx={{
        maxWidth: "calc(50% - 4px)",
        border: "2px solid #777777",
        borderRadius: "5px",
        position: "relative",
        display: "flex"
      }}>
        {children}
    </Box>
  );
}