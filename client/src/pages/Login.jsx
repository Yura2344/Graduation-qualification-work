import { useState } from "react";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { setUser } = useUserContext();

  const [usernameErrMsg, setUsernameErrMsg] = useState("");
  const [passwordErrMsg, setPasswordErrMsg] = useState("");

  const navigate = useNavigate();
  function login() {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    axiosInstance.post('/users/login', params).then((res) => {
      setUser(res.data);
      localStorage.setItem("username", res.data.username);
      navigate("/");
    }).catch((err) => {
      if(err.response.data instanceof Array){
        for(const error of err.response.data){
          if(error.path === "username") setUsernameErrMsg(error.msg);
          if(error.path === "password") setPasswordErrMsg(error.msg);
        }
      }
      console.log(err);
    });
  }

  return (
    <Paper elevation={3} sx={{
      padding: 3,
      width: "200px"
    }}>
      <form>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          rowGap: 2
        }}>
          <Typography variant="h6">Login form</Typography>
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
            autoComplete="current-password"
            label="Password" 
            variant="standard" 
            type="password"
          />
          <Button onClick={login} variant="contained">Login</Button>
        </Box>
      </form>
    </Paper>
  );
}