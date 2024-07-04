import { createBrowserRouter } from "react-router-dom";

import Layout from "./pages/Layout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import MainPage from "./pages/MainPage";
import Chats from "./pages/Chats";
import PostForm from "./components/post/PostForm";
import PostWrapper from "./components/post/PostWrapper";
import User from "./pages/User";
import EditUser from "./pages/EditUser";
import Chat from "./pages/Chat";
import SearchPage from "./pages/SearchPage";
import ErrorPage from "./pages/ErrorPage";
import AddGroupChat from "./pages/AddGroupChat";

export default createBrowserRouter([
    {
        path: "/",
        element: <Layout/>,
        errorElement: <ErrorPage/>,
        children: [
            {
                element: <MainPage/>,
                index: true
            },
            {
                path: "posts/:id",
                children: [
                    {
                        index: true,
                        element: <PostWrapper/>,
                    },
                    {
                        path: "edit",
                        element: <PostWrapper edit={true}/>
                    }
                        
                ]
            },
            {
                path: "users/:username",
                children: [
                    {
                        index: true,
                        element: <User/>
                    },
                    {
                        path: "edit",
                        element: <EditUser/>
                    },
                ]
                
            },
            
            {
                path: "register",
                element: <Register/>
            },
            {
                path: "login",
                element: <Login/>
            },
            {
                path: "search",
                element: <SearchPage/>
            },
            {
                path: "chats",
                children: [
                    {
                        index: true,
                        element: <Chats/>
                    },
                    {
                        path: ":chatId",
                        element: <Chat/>
                    }
                ]
            },
            {
                path: "addPost",
                element: <PostForm/>
            },
            {
                path: "addChat",
                element: <AddGroupChat/>
            },
            {
                path: "logout",
                element: <Logout/>
            }
        ]
    }
]);