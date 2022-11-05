import React, { useRef, useState, useContext } from "react";
import {
    Text,
    Group,
    Button,
    createStyles,
    Title,
    TextInput,
    Tooltip,
    Progress,
    Skeleton,
    Container,
    Image,
    Badge,
    Center,
    NumberInput,
    NumberInputHandlers,
    ActionIcon,
    Switch,
    Slider,
    Modal,
    Textarea,
    Grid,
    SimpleGrid,
} from "@mantine/core";
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons";
import { DropzoneButton } from "./DropzoneButton";
import { showNotification, updateNotification } from "@mantine/notifications";
import BalanceContext from "../context/balanceContext";
import DepositContext from "../context/depositContext";

import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import {
    canisterId as ledgerCanisterId,
    createActor as createLegerActor,
} from "../../../declarations/ledger/index";
import { AuthClient } from "@dfinity/auth-client";
import { useNavigate, useLocation } from "react-router-dom";

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: "relative",
        marginBottom: 30,
        marginTop: 30,
    },

    dropzone: {
        borderWidth: 1,
        paddingBottom: 50,
    },

    icon: {
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
    },

    control: {
        position: "absolute",
        width: 250,
        left: "calc(50% - 125px)",
        bottom: -20,
    },

    button: {
        marginTop: 20,
        marginBottom: 30,
    },

    progress: {
        position: "absolute",
        bottom: -1,
        right: -1,
        left: -1,
        top: -1,
        height: "auto",
        backgroundColor: "transparent",
        zIndex: 0,
    },

    label: {
        position: "relative",
        zIndex: 1,
    },
    card: {
        transition: "transform 150ms ease, box-shadow 150ms ease",

        "&:hover": {
            transform: "scale(1.01)",
            boxShadow: theme.shadows.md,
            cursor: "pointer",
        },
    },
}));

const minMintFee = 22223;
const icp_fee = 10000;
const maxFiles = 5;
const postFee = 50000;

function Upload() {
    const balanceCtx = useContext(BalanceContext);
    const depositCtx = useContext(DepositContext);
    const navigate = useNavigate();
    const [titleOpened, setTitleOpened] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [symbol, setSymbol] = useState("");
    const [symbolOpened, setSymbolOpened] = useState(false);
    const symbolValid = !!symbol && symbol.length > 0;
    const titleValid = title.length > 0;
    const [mintFee, setMintFee] = useState(minMintFee);
    const [mintFeeOpened, setMintFeeOpened] = useState(false);
    const mintFeeValid =
        !!mintFee && Number.isInteger(mintFee) && mintFee >= minMintFee;
    // console.log(Number.isInteger(mintFee));
    // console.log(mintFee);
    const [maxSupply, setMaxSupply] = useState(1);
    const [maxSupplyOpened, setMaxSupplyOpened] = useState(false);
    const maxSupplyValid =
        !!maxSupply && Number.isInteger(maxSupply) && maxSupply > 0;
    const [files, setFiles] = useState([]);
    const postValid =
        titleValid &&
        maxSupplyValid &&
        mintFeeValid &&
        symbolValid &&
        files &&
        files.length > 0;
    const [postModalOpened, setPostModalOpened] = useState(false);

    const convertBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };

    const post = async () => {
        showNotification({
            id: "load-data",
            loading: true,
            title: "Posting",
            message:
                "Please wait while we are posting your content to the blockchain",
            autoClose: false,
            disallowClose: true,
        });
        const result = await balanceCtx.refresh();
        if (
            !result.amountDeposited ||
            parseInt(result.amountDeposited) < parseInt(postFee)
        ) {
            updateNotification({
                id: "load-data",
                autoClose: 5000,
                title: "Insufficient balance",
                message:
                    "You haven't deposited enough ledger tokens. Post fee is 50000 ledger tokens",
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
        // const base64 = await convertBase64(files[0]);
        const base64Images = files.map(async (file) => {
            return await convertBase64(file);
        });
        const base64ImagesResolved = await Promise.all(base64Images);
        console.log(base64ImagesResolved);

        try {
            const res = await authenticatedGenzerCanister.addPost(
                base64ImagesResolved,
                title,
                symbol,
                description,
                mintFee,
                maxSupply
            );
            console.log("res", res);
            if (res == true) {
                updateNotification({
                    id: "load-data",
                    color: "teal",
                    title: "Posted Successfully",
                    icon: <IconCheck size={16} />,
                    autoClose: 2000,
                });
                setPostModalOpened(false);
                navigate("/profile");
            } else {
                updateNotification({
                    id: "load-data",
                    autoClose: 5000,
                    title: "Unable to create post",
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
                title: "Unable to create post",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
        }
    };

    const handlePost = async () => {
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
        if (!postValid) {
            showNotification({
                id: "hello-there",
                // onClose: () => console.log("unmounted"),
                // onOpen: () => console.log("mounted"),
                autoClose: 5000,
                title: "Cannot post",
                message:
                    "Filled in all the required fields and upload at least one file",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
            return;
        }
        // if (!balanceCtx.balance || balanceCtx.balance < postFee) {
        //     showNotification({
        //         id: "hello-there",
        //         // onClose: () => console.log("unmounted"),
        //         // onOpen: () => console.log("mounted"),
        //         autoClose: 5000,
        //         title: "Insufficient balance",
        //         message:
        //             "You don't have enough ledger tokens to post. Post fee is 50000 ledger tokens",
        //         color: "red",
        //         icon: <IconX />,
        //         className: "my-notification-class",
        //         loading: false,
        //     });
        //     return;
        // }
        setPostModalOpened(true);
        // const authClient = await AuthClient.create();
        // const identity = await authClient.getIdentity();
        // console.log(identity.getPrincipal().toText());

        // const authenticatedGenzerCanister = createGenzerActor(
        //     genzerCanisterId,
        //     {
        //         agentOptions: {
        //             identity,
        //         },
        //     }
        // );
        // const depositAddress =
        //     await authenticatedGenzerCanister.getDepositAddress();
        // console.log("deposit Address", depositAddress);

        // const authenticatedLedgerCanister = createLegerActor(ledgerCanisterId, {
        //     agentOptions: {
        //         identity,
        //     },
        // });

        // const transfer = await authenticatedLedgerCanister.transfer({
        //     memo: 1,
        //     to: depositAddress,
        //     amount: { e8s: BigInt(postFee) },
        //     fee: { e8s: BigInt(icp_fee) },
        //     from_subaccount: [],
        //     created_at_time: [],
        // });
        // console.log("transfer", transfer);
    };

    return (
        <>
            <Tooltip
                label={titleValid ? "All good!" : "Title shouldn't be empty"}
                position="bottom-start"
                withArrow
                opened={titleOpened}
                color={titleValid ? "teal" : undefined}
            >
                <TextInput
                    label="Title"
                    required
                    placeholder="Your title"
                    onFocus={() => setTitleOpened(true)}
                    onBlur={() => setTitleOpened(false)}
                    mt="md"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                />
            </Tooltip>

            <Tooltip
                label={
                    titleValid
                        ? "All good!"
                        : "Symbol shouldn't be empty and should be greater than 0"
                }
                position="bottom-start"
                withArrow
                opened={symbolOpened}
                color={symbolValid ? "teal" : undefined}
            >
                <TextInput
                    label="Symbol"
                    required
                    placeholder="Your symbol"
                    onFocus={() => setSymbolOpened(true)}
                    onBlur={() => setSymbolOpened(false)}
                    mt="md"
                    value={symbol}
                    onChange={(event) => setSymbol(event.currentTarget.value)}
                />
            </Tooltip>

            <Textarea
                label="Description"
                placeholder="Your description"
                mt="md"
                autosize
                minRows={2}
                maxRows={4}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
            />
            <div style={{ marginTop: "25px" }}>
                <DropzoneButton
                    files={files}
                    setFiles={setFiles}
                    maxFiles={maxFiles}
                />
            </div>
            <Tooltip
                label={
                    maxSupplyValid
                        ? "All good!"
                        : "max supply should be greater than 0"
                }
                position="bottom-start"
                withArrow
                opened={maxSupplyOpened}
                color={maxSupplyValid ? "teal" : undefined}
            >
                <TextInput
                    label="Max supply"
                    required
                    placeholder={"Your max supply"}
                    onFocus={() => setMaxSupplyOpened(true)}
                    onBlur={() => setMaxSupplyOpened(false)}
                    mt="md"
                    value={maxSupply}
                    // type="number"
                    min={1}
                    step="1"
                    onChange={(event) => {
                        let value = 0;
                        if (event.target.value == "" || !event.target.value) {
                            value = 0;
                            setMaxSupply(value);
                        } else if (
                            Number.isInteger(parseInt(event.target.value))
                        ) {
                            value = parseInt(event.target.value);
                            setMaxSupply(value);
                        }
                    }}
                />
            </Tooltip>

            <Tooltip
                label={
                    mintFeeValid
                        ? "All good!"
                        : "Minimum mint fee should be : " + minMintFee
                }
                position="bottom-start"
                withArrow
                opened={mintFeeOpened}
                color={mintFeeValid ? "teal" : undefined}
            >
                <TextInput
                    label="Mint Fee"
                    required
                    placeholder={
                        "Your mint fee | ( minimum : " + minMintFee + " )"
                    }
                    onFocus={() => setMintFeeOpened(true)}
                    onBlur={() => setMintFeeOpened(false)}
                    mt="md"
                    value={mintFee}
                    // type="number"
                    min={minMintFee}
                    step="1"
                    onChange={(event) => {
                        let value = 0;
                        if (event.target.value == "" || !event.target.value) {
                            value = 0;
                            setMintFee(value);
                        } else if (
                            Number.isInteger(parseInt(event.target.value))
                        ) {
                            value = parseInt(event.target.value);
                            setMintFee(value);
                        }
                        // console.log("value", parseInt(event.target.value));
                        // console.log(
                        //     "isValid",
                        //     Number.isInteger(parseInt(event.target.value))
                        // );
                        // if (Number.isInteger(parseInt(event.target.value))) {
                        //     setMintFee(parseInt(event.target.value));
                        // }
                    }}
                />
                {/* <NumberInput
                    label={"Mint Fee ( minimum : " + minMintFee + " )"}
                    required
                    hideControls
                    placeholder={"Your mint fee"}
                    onFocus={() => setMintFeeOpened(true)}
                    onBlur={() => setMintFeeOpened(false)}
                    mt="md"
                    value={mintFee}
                    // type="number"
                    min={minMintFee}
                    step="1"
                    onChange={(value) => {
                        console.log("value", value);
                        console.log("isValid", Number.isInteger(value));
                        if (Number.isInteger(value)) {
                            setMintFee(value);
                        }
                        // Number.isInteger(value) && setMintFee(value);
                        // setMintFee(value);
                    }}
                    // icon={<IconMedal size={18} />}
                /> */}
            </Tooltip>
            <Text
                // component="span"
                align="center"
                variant="gradient"
                gradient={{ from: "red", to: "red", deg: 45 }}
                size="md"
                weight={700}
                style={{ fontFamily: "Greycliff CF, sans-serif" }}
            >
                Note: 20000 will be deducted from your mint fee for two transfer
                using LEDGER canister. And this canister will get 10% from the
                rest.
            </Text>
            {mintFeeValid && (
                <Text
                    // component="span"
                    align="center"
                    variant="gradient"
                    gradient={{ from: "yellow", to: "red", deg: 45 }}
                    size="md"
                    weight={700}
                    style={{ fontFamily: "Greycliff CF, sans-serif" }}
                >
                    Amount you will get :
                    {parseInt(mintFee - (mintFee * 10) / 100 - 2 * icp_fee)}
                </Text>
            )}
            <Center style={{ marginTop: "25px" }}>
                <Button
                    variant="gradient"
                    gradient={{ from: "teal", to: "lime", deg: 105 }}
                    onClick={() => {
                        handlePost();
                    }}
                >
                    Post
                </Button>
            </Center>

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
                Post fee : {postFee} ledger tokens
            </Text>
            <Modal
                opened={postModalOpened}
                onClose={() => setPostModalOpened(false)}
                title="Post"
            >
                <SimpleGrid cols={2}>
                    <Button
                        color="yellow"
                        onClick={async () => {
                            setPostModalOpened(false);
                            await depositCtx.deposit(
                                postFee,
                                true,
                                () => {
                                    handlePost();
                                },
                                () => {
                                    post();
                                },
                                () => {
                                    setPostModalOpened(false);
                                }
                            );
                        }}
                    >
                        Deposit Post Fee
                    </Button>
                    <Button color="orange" onClick={() => post()}>
                        Already Deposited
                    </Button>
                </SimpleGrid>
            </Modal>
        </>
    );
}

export default Upload;
