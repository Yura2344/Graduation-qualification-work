import { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { axiosInstance } from "../axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const [usernameErrMsg, setUsernameErrMsg] = useState("");
  const [passwordErrMsg, setPasswordErrMsg] = useState("");
  const [confirmPasswordErrMsg, setConfirmPasswordErrMsg] = useState("");

  function register() {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);
    params.append("confirmPassword", confirmPassword);

    axiosInstance.post('/users/', params).then((res) => {
      navigate("/login");
    }).catch((err) => {
      if(err.response.data instanceof Array){
        for(const error of err.response.data){
          if(error.path === "username") setUsernameErrMsg(error.msg);
          if(error.path === "password") setPasswordErrMsg(error.msg);
          if(error.path === "confirmPassword") setConfirmPasswordErrMsg(error.msg);
        }
      }
      console.log(err);
    });
  }

  return (
    <Paper elevation={3} sx={{
      padding: 3,
      width: "200px",
    }}>
      <form>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 2
        }}>
          <Typography variant="h6">Register form</Typography>
          <TextField 
            value={username}
            error={usernameErrMsg !== ""}
            helperText={usernameErrMsg}
            onChange={(e) => {setUsername(e.target.value); setUsernameErrMsg("");}} 
            autoComplete="username"
            label="Username" 
            variant="standard" 
            />
          <TextField
            value={password}
            error={passwordErrMsg !== ""}
            helperText={passwordErrMsg}
            onChange={(e) => {setPassword(e.target.value); setPasswordErrMsg("");}}
            autoComplete="new-password" 
            label="Password" 
            variant="standard" 
            type="password" 
            />
          <TextField
            value={confirmPassword}
            error={confirmPasswordErrMsg !== ""}
            helperText={confirmPasswordErrMsg}
            onChange={(e) => {setConfirmPassword(e.target.value); setConfirmPasswordErrMsg("");}}
            autoComplete="new-password" 
            label="Confirm password" 
            variant="standard" 
            type="password" 
          />
          <Button onClick={register} variant="contained">Register</Button>
        </Box>

      </form>
    </Paper>
  );
}