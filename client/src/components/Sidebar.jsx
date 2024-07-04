import { Add, Chat, Home, Login, Logout, PersonAdd, Search } from "@mui/icons-material";
import { Avatar, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

import { useUserContext } from "./user/UserContext";

export default function Sidebar() {

  const { user, userLoading } = useUserContext();
  return (
    <Drawer open={true} variant="persistent" anchor="left" sx={{
      width: "240px",
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: "240px", boxSizing: 'border-box' },
    }}>
      <List>
        <ListItem key="main-page">
          <ListItemButton href="/">
            <ListItemIcon>
              <Home />
            </ListItemIcon>
            <ListItemText>Main page</ListItemText>
          </ListItemButton>
        </ListItem>
        <ListItem key="search">
          <ListItemButton href="/search">
            <ListItemIcon>
              <Search />
            </ListItemIcon>
            <ListItemText>Search</ListItemText>
          </ListItemButton>
        </ListItem>
        {
          (!userLoading && user) && [
            <ListItem key="chats">
              <ListItemButton href="/chats">
                <ListItemIcon>
                  <Chat />
                </ListItemIcon>
                <ListItemText>Chats</ListItemText>
              </ListItemButton>
            </ListItem>,
            <ListItem key="add-post">
              <ListItemButton href="/addPost">
                <ListItemIcon>
                  <Add />
                </ListItemIcon>
                <ListItemText>Add post</ListItemText>
              </ListItemButton>
            </ListItem>,
            <ListItem key="add-chat">
            <ListItemButton href="/addChat">
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText>Add group chat</ListItemText>
            </ListItemButton>
          </ListItem>,
            <ListItem key="my-account">
              <ListItemButton href={`/users/${user.username}`}>
                <ListItemIcon>
                  <Avatar src={user.avatarURL} />
                </ListItemIcon>
                <ListItemText>My account</ListItemText>
              </ListItemButton>
            </ListItem>,
            <ListItem key="logout">
              <ListItemButton href="/logout">
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </ListItemButton>
            </ListItem>
          ]
        }
        {
          (!userLoading && !user) && [
            <ListItem key="register">
              <ListItemButton href="/register">
                <ListItemIcon>
                  <PersonAdd />
                </ListItemIcon>
                <ListItemText>Register</ListItemText>
              </ListItemButton>
            </ListItem>,
            <ListItem key="login">
              <ListItemButton href="/login">
                <ListItemIcon>
                  <Login />
                </ListItemIcon>
                <ListItemText>Login</ListItemText>
              </ListItemButton>
            </ListItem>
          ]
        }

      </List>
    </Drawer>
  );
}