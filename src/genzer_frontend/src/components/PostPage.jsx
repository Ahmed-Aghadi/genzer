import React, { useContext, useEffect, useState } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { AuthClient } from "@dfinity/auth-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
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
import { CardsCarousel } from "./CardsCarousel";
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons";

const icp_fee = 10000;
function PostPage() {
    const params = useParams();
    const postCanisterId = params.id;
    const balanceCtx = useContext(BalanceContext);
    const depositCtx = useContext(DepositContext);
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [owner, setOwner] = useState("");
    const [symbol, setSymbol] = useState("");
    const [images, setImages] = useState([]);
    const [mintFee, setMintFee] = useState();
    const [nftSupplied, setNftSupplied] = useState();
    const [maxSupply, setMaxSupply] = useState();
    const [loading, setLoading] = useState(true);
    const [found, setFound] = useState(false);
    const [mintModalOpened, setMintModalOpened] = useState(false);
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
        // console.log("postCanisterId", postCanisterId);
        try {
            const authenticatedNFTokenCanister = createNFTokenActor(
                postCanisterId,
                {
                    agentOptions: {
                        identity,
                    },
                }
            );
            const title = await authenticatedNFTokenCanister.name();
            const description = await authenticatedNFTokenCanister.desc();
            const symbol = await authenticatedNFTokenCanister.symbol();
            const mintFee = (
                await authenticatedNFTokenCanister.mintFee()
            ).toString();
            const owner = (
                await authenticatedGenzerCanister.getPostOwner(
                    Principal.fromText(postCanisterId)
                )
            ).toText();
            const nftSupplied = (
                await authenticatedGenzerCanister.getNFTSupplied(
                    Principal.fromText(postCanisterId)
                )
            ).toString();
            const maxSupply = (
                await authenticatedGenzerCanister.getNFTMaxSupply(
                    Principal.fromText(postCanisterId)
                )
            ).toString();
            const images = await authenticatedNFTokenCanister.logos();
            // console.log("title", title);
            // console.log("description", description);
            // console.log("symbol", symbol);
            // console.log("owner", owner);
            setTitle(title);
            setDescription(description);
            // setDescription(
            //     "Sed eget nunc pretium, maximus felis sit amet, porttitor felis. Suspendisse tortor elit, suscipit eget semper vel, iaculis pretium lorem. Vivamus at felis ipsum. Vestibulum purus neque, molestie sit amet pulvinar sit amet, luctus a sem. Nunc accumsan bibendum euismod. Morbi euismod bibendum mauris a hendrerit. Suspendisse gravida, libero non commodo condimentum, eros nulla ornare est, non pellentesque eros libero accumsan eros. Integer viverra rutrum sollicitudin. Donec dapibus orci ante, vel luctus dolor sollicitudin a. Cras tincidunt felis non tortor porta dictum. Sed ut mauris a risus egestas sollicitudin quis in eros. Integer auctor pharetra nunc, nec egestas libero iaculis vel. Sed faucibus pretium pellentesque. Quisque in vulputate sapien, non pellentesque elit. Suspendisse pulvinar pellentesque eros ut congue. Donec egestas sem sodales nisl tincidunt, at aliquet nisi sagittis."
            // );
            setSymbol(symbol);
            setMintFee(mintFee);
            setOwner(owner);
            setMaxSupply(maxSupply);
            console.log("maxSupply", maxSupply);
            setNftSupplied(nftSupplied);
            console.log("nftSupplied", nftSupplied);
            // console.log("images", images);
            setImages(images);
            setFound(true);
        } catch (error) {
            console.log("error", error);
            setFound(false);
        }
        setLoading(false);
    };
    const data = images.map((image, index) => {
        return {
            index: index,
            image: image,
        };
    });

    const mint = async () => {
        console.log("minting...");
        showNotification({
            id: "load-data",
            loading: true,
            title: "Minting...",
            message: "Please wait while we mint your NFT.",
            autoClose: false,
            disallowClose: true,
        });
        const result = await balanceCtx.refresh();
        if (
            !result.amountDeposited ||
            parseInt(result.amountDeposited) < parseInt(mintFee)
        ) {
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Insufficient balance",
                message:
                    "You haven't deposited enough ledger tokens. Mint fee is " +
                    mintFee +
                    " ledger tokens",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
            return;
        }

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

        try {
            const res = await authenticatedGenzerCanister.mintPost(
                Principal.fromText(postCanisterId)
            );
            console.log("res", res);
            if (res.Ok != undefined) {
                updateNotification({
                    id: "load-data",
                    color: "teal",
                    title: "Minted Successfully",
                    icon: <IconCheck size={16} />,
                    autoClose: 2000,
                });
                setMintModalOpened(false);
                navigate("/nft/" + postCanisterId + "/" + BigInt(res.Ok));
            } else {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to Mint",
                    message: "Check console for more details",
                    color: "red",
                    icon: <IconX />,
                    className: "my-notification-class",
                    loading: false,
                });
            }
        } catch (error) {
            console.log("error", error);
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Unable to Mint",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
        }
    };

    const handleMint = async () => {
        const authClient = await AuthClient.create();
        if (!(await authClient.isAuthenticated())) {
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
        setMintModalOpened(true);
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
                            <Badge
                                variant="gradient"
                                gradient={{
                                    from: "teal",
                                    to: "lime",
                                    deg: 105,
                                }}
                                mb="md"
                            >
                                {parseInt(nftSupplied) +
                                    "/" +
                                    parseInt(maxSupply) +
                                    " minted "}
                            </Badge>
                        </Center>

                        <Center>
                            <Tooltip
                                label="Post Owner"
                                transition="skew-up"
                                transitionDuration={300}
                                closeDelay={500}
                                color="lime"
                                withArrow
                            >
                                <Badge
                                    component="a"
                                    href={`profile/${owner}`}
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
                                    {owner}
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

                        {data && data.length > 0 && (
                            <CardsCarousel data={data} scr={true} />
                        )}

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
                        {parseInt(nftSupplied) < parseInt(maxSupply) ? (
                            <Center>
                                <Button
                                    mt="md"
                                    color="yellow"
                                    radius="md"
                                    size="md"
                                    onClick={() => {
                                        console.log("minting");
                                        handleMint();
                                    }}
                                >
                                    Mint
                                </Button>
                            </Center>
                        ) : (
                            <Tooltip
                                label="Max Supply Reached"
                                transition="skew-up"
                                transitionDuration={300}
                                closeDelay={500}
                                color="red"
                                withArrow
                            >
                                <Center>
                                    <Button
                                        mt="md"
                                        color="yellow"
                                        radius="md"
                                        size="md"
                                        disabled
                                    >
                                        Mint
                                    </Button>
                                </Center>
                            </Tooltip>
                        )}
                        <Text
                            // component="span"
                            align="center"
                            variant="gradient"
                            gradient={{ from: "red", to: "red", deg: 45 }}
                            size="md"
                            weight={700}
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                                marginTop: "10px",
                            }}
                        >
                            Mint fee : {mintFee} ledger tokens
                        </Text>

                        <Text
                            align="center"
                            variant="gradient"
                            gradient={{ from: "red", to: "red", deg: 45 }}
                            size="md"
                            weight={700}
                            style={{
                                fontFamily: "Greycliff CF, sans-serif",
                                marginTop: "10px",
                            }}
                        >
                            ICP FEE of {icp_fee} ledger tokens is not included
                            in mint fee
                        </Text>

                        <Modal
                            opened={mintModalOpened}
                            onClose={() => setMintModalOpened(false)}
                            title="Mint"
                        >
                            <SimpleGrid cols={2}>
                                <Button
                                    color="yellow"
                                    onClick={async () => {
                                        setMintModalOpened(false);
                                        await depositCtx.deposit(
                                            mintFee,
                                            true,
                                            () => {
                                                handleMint();
                                            },
                                            () => {
                                                mint();
                                            },
                                            () => {
                                                setMintModalOpened(false);
                                            }
                                        );
                                    }}
                                >
                                    Deposit Mint Fee
                                </Button>
                                <Button color="orange" onClick={() => mint()}>
                                    Already Deposited
                                </Button>
                            </SimpleGrid>
                        </Modal>
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
                        Post not found
                    </Text>
                )}
            </Skeleton>
        </>
    );
}

export default PostPage;
