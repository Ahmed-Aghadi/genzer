import * as React from "react";
import { Principal } from "@dfinity/principal";
import { genzer_backend } from "../../declarations/genzer_backend";
import { ledger } from "../../declarations/ledger";
import {
    AppShell,
    Header,
    MantineProvider,
    ColorSchemeProvider,
    Grid,
    Text,
} from "@mantine/core";
import { NavbarMinimal } from "./components/Navigation"
import Main from "./components/Main";
import { useLocalStorage } from "@mantine/hooks";
import { IconCircleDotted } from "@tabler/icons";

export default function App() {
    const [colorScheme, setColorScheme] = useLocalStorage({
        key: "mantine-color-scheme",
        defaultValue: "light",
    });

    const toggleColorScheme = (value) => {
        setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
    };

    const [name, setName] = React.useState('');
    const [message, setMessage] = React.useState('');

    async function doGreet() {
        const greeting = await genzer_backend.greet(name);
        setMessage(greeting);
    }

    async function getUserPrincipal() {
        console.log(genzer_backend)
        const userPrincipal = await genzer_backend.getPrincipal();
        console.log("userPrincipal", userPrincipal);
    }

    // ledger balance
    async function getLedgerBalance() {
        const balance = await genzer_backend.getUserBalance();
        console.log("balance", balance);
    }

    // ledger balance
    async function getCanisterLedgerBalance() {
        const balance = await genzer_backend.canisterBalance();
        console.log("balance", balance);
    }

    // ledger balance
    async function getCanisterSubaccountLedgerBalance() {
        const balance = await genzer_backend.canisterSubAccountBalance();
        // const balance = await ledger.account_balance({ account : await genzer_backend.getCanisterAccountIdentifier() });
        console.log("balance", balance);
    }

    // ledger transfer
    async function transfer() {
        const canisterAccountId = await genzer_backend.getCanisterSubAccountAccountIdentifier()
        const transfer = await ledger.transfer({ memo: 1, to: canisterAccountId, amount: { e8s: BigInt("20000") }, fee: { e8s: BigInt("10000") }, from_subaccount: [], created_at_time: [] });
        console.log("transfer", transfer);
    }

    const queryArchiveBlocks = async () => {
        const GetBlocksArgs = {
            start: BigInt("0"),
            length: BigInt("1"),
        };
        const res = await ledger.query_blocks(GetBlocksArgs);
        console.log(res);
    };

    const getCanisterSubAccountAccountIdentifier = async () => {
        const res = await genzer_backend.getCanisterSubAccountAccountIdentifier();
        console.log(res);
    };

    return (
        <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
        >
            <MantineProvider
                theme={{ colorScheme }}
                withGlobalStyles
                withNormalizeCSS
            >
                <AppShell
                    padding="md"
                    navbar={<NavbarMinimal />}
                    header={
                        <Header height={60} p="xs">
                            <Grid
                                justify="space-between"
                                columns={2}
                                align="center"
                                pl={35}
                                pr={35}
                                mt={2}
                            >
                                <Grid columns={2}>
                                    <Text size={25} weight={700}>
                                        Genzer
                                    </Text>
                                    <IconCircleDotted size={35} />
                                </Grid>
                                {/* <ConnectButton /> */}
                            </Grid>
                            {/* Header content */}
                        </Header>
                    }
                    styles={(theme) => ({
                        main: {
                            backgroundColor:
                                theme.colorScheme === "dark"
                                    ? theme.colors.dark[8]
                                    : theme.colors.gray[0],
                        },
                    })}
                >
                    <Main />
                </AppShell>
            </MantineProvider>
        </ColorSchemeProvider >

    );
};

// <div style={{ "fontSize": "30px" }}>
//         <div style={{ "backgroundColor": "yellow" }}>
//           <p>Greetings, from DFINITY!</p>
//           <p>
//             Type your message in the Name input field, then click{" "}
//             <b> Get Greeting</b> to display the result.
//           </p>
//         </div>
//         <div style={{ margin: "30px" }}>
//           <input
//             id="name"
//             value={name}
//             onChange={(ev) => setName(ev.target.value)}
//           ></input>
//           <button onClick={doGreet}>Get Greeting!</button>
//           <button onClick={getUserPrincipal}>Get User Principal!</button>
//           <button onClick={getLedgerBalance}>Get User Ledger balance!</button>
//           <button onClick={getCanisterLedgerBalance}>Get Canister Ledger balance!</button>
//           <button onClick={getCanisterSubaccountLedgerBalance}>Get Canister Subaccount Ledger balance!</button>
//           <button onClick={queryArchiveBlocks}>queryArchiveBlocks</button>
//           <button onClick={transfer}>transfer!</button>
//           <button onClick={getCanisterSubAccountAccountIdentifier}>getCanisterSubAccountAccountIdentifier</button>
//         </div>z
//         <div>
//           Greeting is: "
//           <span style={{ color: "blue" }}>{message}</span>"
//         </div>
//       </div>