import React, { useEffect, useState } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import PostCard from "../components/PostCard";
import Posts from "./Posts";
import { showNotification, updateNotification } from "@mantine/notifications";
import {
    IconCloudUpload,
    IconX,
    IconDownload,
    IconCheck,
    IconMessageCircle,
    IconPhoto,
} from "@tabler/icons";
import {
    createStyles,
    SimpleGrid,
    Card,
    Image,
    Text,
    Tabs,
    Container,
    AspectRatio,
} from "@mantine/core";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NFTs from "./NFTs";

function Profile() {
    const params = useParams();
    const userId = params.id;
    const navigate = useNavigate();
    // console.log("userId", userId);
    const [posts, setPosts] = useState([]);
    const [nfts, setNFTs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isIIConnected, setIsIIConnected] = useState(true);

    useEffect(() => {
        handleLoad();
    }, []);

    const handleLoad = async () => {
        const authClient = await AuthClient.create();
        if (!(await authClient.isAuthenticated())) {
            setIsIIConnected(false);
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Connect Internet Identity",
                message:
                    "Please connect your Internet Identity to post content",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
            return;
        }

        const identity = await authClient.getIdentity();
        let principalIdText;
        if (!userId) {
            navigate(`/profile/${identity.getPrincipal().toText()}`);
            principalIdText = identity.getPrincipal().toText();
        } else {
            principalIdText = userId;
        }

        const authenticatedGenzerCanister = createGenzerActor(
            genzerCanisterId,
            {
                agentOptions: {
                    identity,
                },
            }
        );

        fetchPosts(authenticatedGenzerCanister, principalIdText);
        fetchNFTs(authenticatedGenzerCanister, principalIdText);
    };

    const fetchPosts = async (authenticatedGenzerCanister, principalIdText) => {
        const postsFromCall =
            await authenticatedGenzerCanister.getPostToUsers();
        const userPosts = postsFromCall.filter(
            (post) => post[1].toText() === principalIdText
        );
        // console.log("userPosts", userPosts);
        setPosts(userPosts);
    };

    const fetchNFTs = async (authenticatedGenzerCanister, principalIdText) => {
        const nftsFromCall = await authenticatedGenzerCanister.getUserNFTs(
            Principal.fromText(principalIdText)
        );
        console.log("nftsFromCall", nftsFromCall);
        setNFTs(nftsFromCall);
        // const userNFTs = nftsFromCall.filter(
        //     (nft) => nft[1].toText() === principalIdText
        // );
        // // console.log("userNFTs", userNFTs);
        // setNFTs(userNFTs);
    };

    return (
        <>
            {isIIConnected ? (
                <>
                    <Tabs variant="pills" defaultValue="posts">
                        <Tabs.List>
                            <Tabs.Tab
                                value="posts"
                                icon={<IconPhoto size={14} />}
                            >
                                Posts
                            </Tabs.Tab>
                            <Tabs.Tab
                                value="nfts"
                                icon={<IconMessageCircle size={14} />}
                            >
                                NFTs
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="posts" pt="xs">
                            <Posts posts={posts} />
                        </Tabs.Panel>

                        <Tabs.Panel value="nfts" pt="xs">
                            <NFTs nfts={nfts} />
                        </Tabs.Panel>
                    </Tabs>
                </>
            ) : (
                <>
                    <Text
                        // component="span"
                        align="center"
                        // variant="gradient"
                        // gradient={{ from: "red", to: "red", deg: 45 }}
                        size="xl"
                        weight={700}
                        style={{
                            fontFamily: "Greycliff CF, sans-serif",
                            marginTop: "10px",
                        }}
                    >
                        Please connect your Internet Identity to view your posts
                    </Text>
                </>
            )}
        </>
    );
}

export default Profile;
