import { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { useParams } from "react-router";
import { Link } from "react-router-dom";

import { axiosInstance } from "../axios";
import { useUserContext } from "../components/user/UserContext";
import Post from "../components/post/Post";

export default function User() {
  const { username } = useParams();

  const { user, userLoading } = useUserContext();
  const [sameUser, setSameUser] = useState();
  const [isFollowing, setIsFollowing] = useState();
  const [followersCount, setFollowersCount] = useState();
  const [followingsCount, setFollowingsCount] = useState();
  const [avatarURL, setAvatarURL] = useState(`${process.env.PUBLIC_URL}/avatar_placeholder.png`);
  const [posts, setPosts] = useState([]);

  function followUser() {
    axiosInstance.post(`/users/${username}/follow`).then((res) => {
      setIsFollowing(true);
      getFollowingFollowersCount()
    });
  }

  function unfollowUser() {
    axiosInstance.delete(`/users/${username}/follow`).then((res) => {
      setIsFollowing(false);
      getFollowingFollowersCount()
    });
  }

  const getIsFollowing = useCallback(() => {
    axiosInstance.get(`/users/${username}/is_following`).then((res) => {
      setIsFollowing(res.data.following);
    });
  }, [username]);

  function writeMessage(){

  }

  const getFollowingFollowersCount = useCallback(() => {
    axiosInstance.get(`/users/${username}/following_followers_count`).then((res) => {
      setFollowersCount(res.data.followersCount);
      setFollowingsCount(res.data.followingsCount);
    });
  }, [username])

  useEffect(() => {
    if (userLoading) return;
    setSameUser(user?.username === username);
    axiosInstance.get(`/users/${username}`).then((res) => {
      if (res.data.avatarURL) {
        setAvatarURL(res.data.avatarURL);
      }
      getFollowingFollowersCount()
      if (user) {
        getIsFollowing();
      }
      axiosInstance.get(`/users/${username}/posts`).then((res) => {
        setPosts(res.data);
      }).catch((err) => {
        console.log(err);
      });

    });
  }, [getFollowingFollowersCount, getIsFollowing, userLoading, user, username]);

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      rowGap: 2
    }}>
      <Card elevation={3} sx={{
        p: 2,
        width: "100%",
        minWidth: "400px",
        maxWidth: "800px"
      }}>
        <CardContent>
          <Box display="flex" columnGap={2}>
            <Box sx={{
              maxWidth: "200px",
              maxHeight: "200px"
            }}>
              <img style={{ maxWidth: "100%", maxHeight: "100%" }} src={avatarURL} alt={username} />
            </Box>
            <Box>
              <Typography variant="h6">{username}</Typography>
              {
                (user?.username === username || user?.role === "admin") && <Typography variant="h6">Role: {user?.role}</Typography>
              }
              {
                !userLoading && (
                  <Box>
                    <Typography>{followersCount} followers; {followingsCount} following</Typography>
                    {
                      user && !sameUser &&
                      [
                        isFollowing ? <Button key="unfollow-user" variant="outlined" onClick={unfollowUser}>Unfollow user</Button> :
                          <Button key="follow-user" variant="contained" onClick={followUser}>Follow user</Button>
                        ,
                        <Button key="write-message" onClick={writeMessage}>Write a message</Button>
                      ]
                    }
                    {
                      sameUser && <Link to={`/users/${username}/edit`}>
                        <Button key="edit-profile" variant="outlined" >Edit profile</Button>
                      </Link>
                    }
                  </Box>
                )
              }
            </Box>
          </Box>

        </CardContent>
      </Card>
      <Typography variant="h5">Posts</Typography>
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        rowGap: 2
      }}>
        {
          posts.length > 0 && posts.map((post) => (
            <Post key={post.id} postData={post} />
          ))
        }
      </Box>
    </Box>

  );
}