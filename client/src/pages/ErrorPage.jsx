import { Box, Button, Typography } from "@mui/material";
import { useNavigate, useRouteError } from "react-router";

export default function ErrorPage(){
  const error = useRouteError();

  const navigate = useNavigate();

  console.log(error);
  return (
    <Box sx={{
      minHeight: "100%",
      p: 3
    }}>
      <Typography variant="h4">{error.status}</Typography>
      <Typography variant="h5">{error.data}</Typography>
      <Button variant="outlined" onClick={() => navigate(-1)}>
        <Typography variant="h6">Return back</Typography>
      </Button>
    </Box>
  );
}