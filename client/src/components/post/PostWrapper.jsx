import { useEffect, useState } from "react";
import { useParams } from "react-router";

import Post from "./Post";
import { axiosInstance } from "../../axios";
import PostForm from "./PostForm";

export default function PostWrapper({edit = false}){
  const {id} = useParams();
  const [postData, setPostData] = useState();

  useEffect(()=>{
    if(!postData){
      async function getPost(){
        await axiosInstance.get(`/posts/${id}`).then((res) => {
          setPostData(res.data);
        }).catch((err) => {
          console.log(err);
        });
      }
      getPost();
    }
  }, [id, postData]);


  return postData && (edit ? <PostForm edit={true} postData={postData}/> : <Post postData={postData}/>);
}