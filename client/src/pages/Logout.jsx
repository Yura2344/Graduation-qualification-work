import { useEffect, useState } from "react";
import { Button, Card, Typography } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";

export default function Logout() {
  const [logoutMessage, setLogoutMessage] = useState("waiting");
  const {user, setUser} = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    async function logout(){
      await axiosInstance.post('/users/logout').then((res) => {
        setUser(null);
        localStorage.removeItem("username");
        setLogoutMessage("logged_out");
      }).catch((err) => {
        console.log(err);
        setLogoutMessage("error");
      });
    }
    logout();
  }, [navigate, setUser, user]);

  

  return (
    <Card sx={{p: 2}}>
      {logoutMessage === "waiting" ? (<Typography>Logging out...</Typography>) : 
        (logoutMessage === "logged_out" ? (<>
        <Typography>Logged out</Typography>
        <Link to={"/"}>
        <Button>Return to Main Page</Button>
        </Link>
          </>) :  
          (<Typography>Error while logging out</Typography>))}
    </Card>
  );
}