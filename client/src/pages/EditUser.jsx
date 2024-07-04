import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";
import { enqueueSnackbar } from "notistack";
import 'react-image-crop/dist/ReactCrop.css';

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";
import ChangeAvatarDialog from "../components/user/ChangeAvatarDialog";

export default function EditUser() {
  const { user, userLoading, updateUser } = useUserContext();
  const { username } = useParams();
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState(username);
  const [avatarURL, setAvatarURL] = useState();

  const [role, setRole] = useState("user");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameErrorMessage, setUsernameErrorMessage] = useState("");
  const [oldPasswordErrorMessage, setOldPasswordErrorMessage] = useState("");
  const [newPasswordErrorMessage, setNewPasswordErrorMessage] = useState("");
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState("");
  
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] = useState(false);
  const [isDeleteAvatarDialogOpen, setIsDeleteAvatarDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  
  const [passwordDelete, setPasswordDelete] = useState("");
  const [passwordDeleteErrorMessage, setPasswordDeleteErrorMessage] = useState("");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSameUser, setIsSameUser] = useState(false);

  function handleDeleteAvatarDialogClose() {
    setIsDeleteAvatarDialogOpen(false);
  }

  function handleDeleteUserDialogClose() {
    setIsDeleteUserDialogOpen(false);
  }

  function changeUsername() {
    let params = new URLSearchParams();
    params.append("username", newUsername);
    axiosInstance.put(`/users/${username}/username`, params).then(async (res) => {
      enqueueSnackbar("Successfully changed username");
      await updateUser();
      navigate(`/users/${newUsername}/edit`);
    }).catch((err) => {
      if (err.response.status === 400) {
        for (const error of err.response.data) {
          if (error.path === "username") {
            setUsernameErrorMessage(error.msg);
          }
        }
      }
      console.log(err);
    });
  }

  

  function deleteAvatar(){
    axiosInstance.delete(`/users/${username}/avatar`).then(async () => {
      await updateUser();
      enqueueSnackbar("Successfully deleted avatar");
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      handleDeleteAvatarDialogClose();
    });
  }

  function changePassword() {
    let params = new URLSearchParams();
    params.append("oldPassword", oldPassword);
    params.append("newPassword", newPassword);
    params.append("confirmPassword", confirmPassword);

    axiosInstance.put(`/users/${username}/password`, params).then((res) => {
      enqueueSnackbar("Successfully changed password");
      navigate(0);
    }).catch((err) => {
      if (err.response.status === 400) {
        for (const error of err.response.data) {
          if (error.path === "oldPassword") {
            setOldPasswordErrorMessage(error.msg);
          }
          if (error.path === "newPassword") {
            setNewPasswordErrorMessage(error.msg);
          }
          if (error.path === "confirmPassword") {
            setConfirmPasswordErrorMessage(error.msg);
          }
        }
      }
      console.log(err);
    });
  }

  function deleteUser(){
    let params = new URLSearchParams();
    params.append("password", passwordDelete);
    axiosInstance.delete(`/users/${username}`, {
      headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
      data: {password: passwordDelete}
    }).then((res) => {
      enqueueSnackbar("Successfully deleted user account");
      navigate("/logout");
    }).catch((err) => {
      if(err.response.status === 400){
        for (const error of err.response.data) {
          if (error.path === "password") {
            setPasswordDeleteErrorMessage(error.msg);
          }
        }
      }
      console.log(err);
    });
  }

  function changeRole(){
    let params = new URLSearchParams();
    params.append("role", role);
    axiosInstance.put(`/users/${username}/role`, params).then((res) => {
      enqueueSnackbar("Successfully changed user role");
    }).catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.username !== username && user.role !== "admin")) {
      enqueueSnackbar("You are not allowed to edit user profile");
      navigate(-1);
      return;
    }
    setRole(user.role);
    setIsAdmin(user.role === "admin");
    setIsSameUser(user.username === username);
    if (user.username === username) {
      setAvatarURL(user.avatarURL);
    } else {
      axiosInstance.get(`/users/${username}`).then((res) => {
        setAvatarURL(res.data.avatarURL);
      });
    }

  }, [navigate, user, userLoading, username]);

  return (
    <Card elevation={3} >
      <CardHeader title={username} />
      <CardContent sx={{
        p: 2,
        minWidth: "300px",
        maxWidth: "800px",
        display: "flex",
        columnGap: 3
      }}>
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          rowGap: 3
        }}>
          <Box sx={{
            maxWidth: "200px",
            maxHeight: "200px",
            p: 1
          }}>
            <img style={{ maxWidth: "100%", maxHeight: "100%" }}
              src={avatarURL || `${process.env.PUBLIC_URL}/avatar_placeholder.png`}
              alt={username}
            />
          </Box>
          {
            (!isAdmin || isSameUser) &&
            <Box sx={{
              display: "flex",
              flexDirection: "column",
              rowGap: 1
            }}>
              <Button variant="outlined" onClick={() => setIsChangeAvatarDialogOpen(true)}>
                {avatarURL ? "Change avatar" : "Set avatar"}
              </Button>
              {
                avatarURL && <Button variant="outlined" onClick={() => setIsDeleteAvatarDialogOpen(true)}>Delete avatar</Button>
              }
            </Box>
          }
          {
            (isAdmin && !isSameUser) &&
            <Box sx={{ display: "flex", flexDirection: "column", rowGap: 1 }}>
              <TextField value={role} onChange={(e) => setRole(e.target.value)} select label="User role" sx={{
                width: "100px"
              }}>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={changeRole}>Change role</Button>
            </Box>
          }

        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            rowGap: 3
          }}>
          {
            (!isAdmin || isSameUser) && <Box sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              rowGap: 1
            }}>
              <TextField
                label="Username"
                value={newUsername}
                error={usernameErrorMessage !== ""}
                helperText={usernameErrorMessage}
                onChange={(e) => { setNewUsername(e.target.value); setUsernameErrorMessage(""); }}
              />
              <Button variant="outlined" onClick={changeUsername}>Change username</Button>
            </Box>
          }

          {
            (!isAdmin || isSameUser) && <form>
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                rowGap: 1
              }}>

                <TextField autoComplete="username" value={username} sx={{ display: "none" }} />
                <TextField
                  autoComplete="current-password"
                  label="Old passord"
                  type="password"
                  value={oldPassword}
                  error={oldPasswordErrorMessage !== ""}
                  helperText={oldPasswordErrorMessage}
                  onChange={(e) => { setOldPassword(e.target.value); setOldPasswordErrorMessage("") }}
                />
                <TextField
                  autoComplete="new-password"
                  label="New passord"
                  type="password"
                  value={newPassword}
                  error={newPasswordErrorMessage !== ""}
                  helperText={newPasswordErrorMessage}
                  onChange={(e) => { setNewPassword(e.target.value); setNewPasswordErrorMessage(""); }}
                />
                <TextField
                  autoComplete="new-password"
                  label="Confirm passord"
                  type="password"
                  value={confirmPassword}
                  error={confirmPasswordErrorMessage !== ""}
                  helperText={confirmPasswordErrorMessage}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordErrorMessage("") }}
                />
                <Button variant="outlined" onClick={changePassword}>Change password</Button>


              </Box>
            </form>
          }

          <Button color="error" variant="outlined" onClick={() => setIsDeleteUserDialogOpen(true)}>Delete profile</Button>
        </Box>
      </CardContent>

      <Dialog open={isDeleteAvatarDialogOpen} onClose={handleDeleteAvatarDialogClose}>
        <DialogTitle>Delete avatar</DialogTitle>
        <DialogContent>
          <Typography>Do you really want to delete avatar?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={deleteAvatar}>Yes</Button>
          <Button variant="outlined" onClick={handleDeleteAvatarDialogClose}>No</Button>
        </DialogActions>
      </Dialog>

      <Dialog onClose={handleDeleteUserDialogClose} open={isDeleteUserDialogOpen}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", rowGap: 2 }}>
          <Typography>Enter your password to confirm this action</Typography>
          <TextField 
            value={passwordDelete} 
            error={passwordDeleteErrorMessage !== ""}
            helperText={passwordDeleteErrorMessage}
            onChange={(e) => {setPasswordDelete(e.target.value); setPasswordDeleteErrorMessage("")}}
            type="password" 
            label="Password"
          />

        </DialogContent>
        <DialogActions>
          <Button color="error" variant="outlined" onClick={deleteUser}>Delete</Button>
          <Button variant="contained"onClick={handleDeleteUserDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <ChangeAvatarDialog open={isChangeAvatarDialogOpen} setIsOpen={setIsChangeAvatarDialogOpen} username={username}/>
    </Card>
  );
}