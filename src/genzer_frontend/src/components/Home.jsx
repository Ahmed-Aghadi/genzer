import React, { useEffect, useState } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { AuthClient } from "@dfinity/auth-client";
import PostCard from "../components/PostCard";
import Posts from "./Posts";

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const authClient = await AuthClient.create();
        const identity = await authClient.getIdentity();

        const authenticatedGenzerCanister = createGenzerActor(
            genzerCanisterId,
            {
                agentOptions: {
                    identity,
                },
            }
        );
        const posts = await authenticatedGenzerCanister.getPostToUsers();
        console.log("posts", posts);
        setPosts(posts);
    };
    return (
        <>
            <Posts posts={posts} />
        </>
    );
}

export default Home;
