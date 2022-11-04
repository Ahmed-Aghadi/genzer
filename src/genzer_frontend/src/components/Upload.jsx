import React, { useRef, useState } from "react";
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
} from "@mantine/core";
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons";
import { DropzoneButton } from "./DropzoneButton";

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

function Upload() {
    const [opened, setOpened] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    const titleValid = title.length > 0;

    return (
        <>
            <Tooltip
                label={titleValid ? "All good!" : "Title shouldn't be empty"}
                position="bottom-start"
                withArrow
                opened={opened}
                color={titleValid ? "teal" : undefined}
            >
                <TextInput
                    label="Title"
                    required
                    placeholder="Your title"
                    onFocus={() => setOpened(true)}
                    onBlur={() => setOpened(false)}
                    mt="md"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
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

            <DropzoneButton files={files} setFiles={setFiles} />
        </>
    );
}

export default Upload;