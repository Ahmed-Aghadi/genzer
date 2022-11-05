import React, { useContext, useEffect, useState } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { AuthClient } from "@dfinity/auth-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PostCard from "./PostCard";
import Posts from "./Posts";
import BalanceContext from "../context/balanceContext";
import DepositContext from "../context/depositContext";
import {
    canisterId as ledgerCanisterId,
    createActor as createLegerActor,
} from "../../../declarations/ledger/index";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { createActor as createNFTokenActor } from "../../../declarations/NFToken/index";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { showNotification, updateNotification } from "@mantine/notifications";
import {
    createStyles,
    SimpleGrid,
    Container,
    AspectRatio,
    Badge,
    Button,
    Card,
    Image,
    Modal,
    Text,
    Tooltip,
    ActionIcon,
    Group,
    Center,
    Avatar,
    Skeleton,
    createStyles,
} from "@mantine/core";
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons";

function NFTPage() {
    const params = useParams();
    console.log("params", params);
    const nftCanisterId = params.id;
    const tokenId = params.tokenId;
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [nftOwner, setNftOwner] = useState();
    const [symbol, setSymbol] = useState("");
    const [image, setImage] = useState();
    const [loading, setLoading] = useState(true);
    const [found, setFound] = useState(false);
    useEffect(() => {
        fetchFromPost();
    }, []);

    const fetchFromPost = async () => {
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

        const authenticatedNFTokenCanister = createNFTokenActor(nftCanisterId, {
            agentOptions: {
                identity,
            },
        });
        const tokenInfo = await authenticatedNFTokenCanister.getTokenInfo(
            BigInt(tokenId)
        );
        let tokenIndex;
        if (tokenInfo.ok) {
            tokenIndex = tokenInfo.ok.metadata[0].logoIndex; // bigInt that is Nat
            const image = await authenticatedNFTokenCanister.logo(tokenIndex);
            setImage(image);
            setNftOwner(tokenInfo.ok.owner.toText());
            setFound(true);
        } else {
            setFound(false);
            setLoading(false);
            return;
        }
        const title = await authenticatedNFTokenCanister.name();
        const description = await authenticatedNFTokenCanister.desc();
        const symbol = await authenticatedNFTokenCanister.symbol();
        setTitle(title);
        setDescription(description);
        setSymbol(symbol);
        setLoading(false);
    };

    // console.log("params", params);
    return (
        <>
            <Skeleton sx={{ height: "100%" }} visible={loading}>
                {found ? (
                    <>
                        <Text
                            // component="span"
                            align="center"
                            // variant="gradient"
                            // gradient={{ from: "red", to: "red", deg: 45 }}
                            size="xl"
                            weight={700}
                            mb="md"
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                            }}
                        >
                            {title}
                        </Text>

                        <Center>
                            <Tooltip
                                label="NFT Owner"
                                transition="skew-up"
                                transitionDuration={300}
                                closeDelay={500}
                                color="lime"
                                withArrow
                            >
                                <Badge
                                    component="a"
                                    href={`user/${nftOwner}`}
                                    sx={{ paddingLeft: 0, cursor: "pointer" }}
                                    mb="md"
                                    size="lg"
                                    radius="xl"
                                    color="teal"
                                    leftSection={
                                        <Avatar
                                            alt="Owner avatar"
                                            size={24}
                                            mr={5}
                                            src="null"
                                        />
                                    }
                                >
                                    {nftOwner}
                                </Badge>
                            </Tooltip>
                        </Center>
                        <Text
                            // component="span"
                            align="center"
                            // variant="gradient"
                            // gradient={{ from: "red", to: "red", deg: 45 }}
                            size="md"
                            // weight={700}
                            mb="md"
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                            }}
                        >
                            {description}
                        </Text>

                        <Image
                            sx={{ maxWidth: "lg", maxHeight: "lg" }}
                            fit="contain"
                            src={image}
                            // height={180}
                        />

                        <Center mt="lg">
                            <Badge
                                color="red"
                                variant="outline"
                                size="sm"
                                style={{
                                    fontFamily: "Greycliff CF, sans-serif",
                                }}
                            >
                                {symbol}
                            </Badge>
                        </Center>

                        <Center>
                            <Button
                                mt="md"
                                color="yellow"
                                radius="md"
                                size="md"
                                onClick={() => {
                                    console.log("view post");
                                    navigate(`/post/${nftCanisterId}`);
                                    // handleMint();
                                }}
                            >
                                View Post
                            </Button>
                        </Center>
                    </>
                ) : (
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
                        NFT not found
                    </Text>
                )}
            </Skeleton>
        </>
    );
}

export default NFTPage;
