import { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Outlet, useNavigate } from "react-router";
import { SnackbarProvider } from "notistack";

import Sidebar from "../components/Sidebar";
import { axiosInstance } from "../axios";
import { UserContext } from "../components/user/UserContext";
import { socket } from "../socket";

export default function Layout() {
  const [user, setUser] = useState();
  const [userLoading, setUserLoading] = useState(true);

  const navigate = useNavigate();

  const updateUser = useCallback(async () => {
    await axiosInstance.get("/users/me").then((res) => {
      console.log(res);
      if (res.data instanceof Object) {
        setUser(res.data);
        axiosInstance.get("/users/me/chats").then((res) => {
          for(const chat of res.data){
            socket.emit("connect_to_chat", chat.id);
          }
        }).catch((err) => {
          console.log(err);
        });
      }
      setUserLoading(false);
    }).catch((err) => {
      setUserLoading(false);
      console.log(err);
      if (err.response.status === 401) {
        localStorage.removeItem("username");
        navigate("/login");
      }
    });


  }, [navigate]);

  useEffect(() => {
    console.log(user);
    if (!localStorage.getItem("username")) {
      setUserLoading(false);
      return;
    }
    if (!userLoading) return;
    updateUser();
  }, [userLoading, navigate, user, updateUser]);
  return (
    <SnackbarProvider>
      <UserContext.Provider value={{ user, setUser, userLoading, updateUser }}>
        <Box sx={{ display: "flex", height: "100vh" }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column" }}>
            <Box sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </UserContext.Provider>
    </SnackbarProvider>
  );
}