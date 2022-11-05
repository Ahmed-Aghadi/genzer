import React, { useEffect, useState } from "react";
import { Carousel } from "@mantine/carousel";
import { IconBookmark, IconHeart, IconShare } from "@tabler/icons";
import {
    Badge,
    Card,
    Image,
    Text,
    ActionIcon,
    Badge,
    Group,
    Center,
    Tooltip,
    Avatar,
    Skeleton,
    createStyles,
} from "@mantine/core";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import { createActor as createNFTokenActor } from "../../../declarations/NFToken/index";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

const useStyles = createStyles((theme) => ({
    card: {
        position: "relative",
        backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        transition: "transform 150ms ease, box-shadow 150ms ease",

        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
        },
    },

    rating: {
        position: "absolute",
        top: theme.spacing.xs,
        right: theme.spacing.xs + 2,
        pointerEvents: "none",
    },

    title: {
        display: "block",
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs / 2,
    },

    action: {
        backgroundColor:
            theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
        ...theme.fn.hover({
            backgroundColor:
                theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[1],
        }),
    },

    footer: {
        marginTop: theme.spacing.md,
    },
}));

function NFTCard({ nft }) {
    const { classes, cx, theme } = useStyles();
    const nftCanisterId = nft.NFT; // postCanisterId == nftCanisterId
    const tokenId = nft.tokenId; // bigInt that is Nat
    console.log("nft", nft);
    // const postOwner = post[1];
    // const owner = nft[1].toText();
    const [nftOwner, setNftOwner] = useState();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [symbol, setSymbol] = useState("");
    // const [owner, setOwner] = useState(""); // tokenInfo.ok will always be true here as we are passing correct nft data from NFTs.jsx that's why we are not using this state
    const [image, setImage] = useState();
    const [loading, setLoading] = useState(true);
    // const [found, setFound] = useState(false);
    useEffect(() => {
        fetchFromNFT();
    }, []);

    const fetchFromNFT = async () => {
        const authClient = await AuthClient.create();
        const identity = await authClient.getIdentity();

        // const authenticatedGenzerCanister = createGenzerActor(
        //     genzerCanisterId,
        //     {
        //         agentOptions: {
        //             identity,
        //         },
        //     }
        // );

        const authenticatedNFTokenCanister = createNFTokenActor(nftCanisterId, {
            agentOptions: {
                identity,
            },
        });
        const tokenInfo = await authenticatedNFTokenCanister.getTokenInfo(
            tokenId
        );
        let tokenIndex;

        // tokenInfo.ok will always be true here as we are passing correct nft data from NFTs.jsx
        if (tokenInfo.ok) {
            tokenIndex = tokenInfo.ok.metadata[0].logoIndex; // bigInt that is Nat
            const image = await authenticatedNFTokenCanister.logo(tokenIndex);
            setImage(image);
            setNftOwner(tokenInfo.ok.owner.toText());
            // setFound(true);
        } else {
            // setFound(false);
            setLoading(false);
            return;
        }
        // console.log("postCanisterId", postCanisterId);
        const title = await authenticatedNFTokenCanister.name();
        const description = await authenticatedNFTokenCanister.desc();
        const symbol = await authenticatedNFTokenCanister.symbol();
        // const owner = (
        //     await authenticatedGenzerCanister.getPostOwner(postCanisterId)
        // ).toText();

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
        // setOwner(owner);
        // console.log("images", images);
        setLoading(false);
    };

    const handleShare = () => {
        console.log("share");
        const link = linkProps.href;
        //
        if (navigator.share) {
            navigator
                .share({
                    title: title,
                    text: description,
                    url: link,
                })
                .then(() => console.log("Successful share"))
                .catch((error) => console.log("Error sharing", error));
        }
    };

    const linkProps = {
        // href: link,
        href: "/nft/" + nftCanisterId + "/" + tokenId,
    };

    return (
        <Skeleton
            sx={{ maxWidth: 320, minHeight: 400 }}
            // height={200}
            visible={loading}
        >
            <Card
                withBorder
                radius="md"
                className={cx(classes.card)}
                sx={{ maxWidth: 320 }}
                height={200}
                // {...others}
            >
                <Card.Section>
                    <Image
                        sx={{ maxWidth: 320 }}
                        fit="contain"
                        src={image}
                        height={200}
                    />
                </Card.Section>
                <Badge
                    className={classes.rating}
                    variant="gradient"
                    gradient={{ from: "yellow", to: "red" }}
                >
                    {symbol}
                </Badge>

                <Text
                    className={classes.title}
                    weight={500}
                    component="a"
                    {...linkProps}
                >
                    {title}
                </Text>

                <Text size="sm" color="dimmed" lineClamp={4}>
                    {description}
                </Text>

                <Group position="apart" className={classes.footer}>
                    <Center>
                        {/* <Avatar src={author.image} size={24} radius="xl" mr="xs" /> */}
                        <Badge color="cyan" size="sm">
                            {nftOwner ? nftOwner.substring(0, 8) + "..." : ""}
                        </Badge>
                        {/* <Text size="sm" inline>
                        {owner ? owner.substring(0, 8) + "..." : ""}
                    </Text> */}
                    </Center>

                    <Group spacing={8} mr={0}>
                        <ActionIcon className={classes.action}>
                            <IconHeart size={16} color={theme.colors.red[6]} />
                        </ActionIcon>
                        <ActionIcon className={classes.action}>
                            <IconBookmark
                                size={16}
                                color={theme.colors.yellow[7]}
                            />
                        </ActionIcon>
                        <ActionIcon
                            className={classes.action}
                            onClick={() => {
                                handleShare();
                            }}
                        >
                            <IconShare size={16} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Card>
        </Skeleton>
    );
}

// <Card
//     p="md"
//     sx={{ maxWidth: 320 }}
//     radius="md"
//     // component="a"
//     // href="#"
//     className={classes.card}
//     height={200}
// >
//     <Text color="dimmed" size="xs" transform="uppercase" weight={700} mt="md">
//         {symbol}
//     </Text>
//     <Text className={classes.title} mt={5}>
//         {title}
//     </Text>
//     <Skeleton visible={loading}>
//         <Carousel mx="auto" withIndicators>
//             {images.map((image, index) => (
//                 <Carousel.Slide key={index}>
//                     <Image
//                         sx={{ maxWidth: 320 }}
//                         fit="contain"
//                         src={image}
//                         height={200}
//                     />
//                 </Carousel.Slide>
//             ))}
//         </Carousel>
//     </Skeleton>
// </Card>;

export default NFTCard;
