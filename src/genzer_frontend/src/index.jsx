import * as React from "react";
import { render } from "react-dom";
import App from "./App";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { NotificationsProvider } from "@mantine/notifications";
import { BalanceContextProvider } from "./context/balanceContext";
import { DepositContextProvider } from "./context/depositContext"; // uses balance context
import { ModalsProvider } from "@mantine/modals";

render(
    <MantineProvider withGlobalStyles withNormalizeCSS>
        <ModalsProvider>
            <NotificationsProvider position="top-right" zIndex={2077}>
                <BrowserRouter>
                    <BalanceContextProvider>
                        <DepositContextProvider>
                            <App />
                        </DepositContextProvider>
                    </BalanceContextProvider>
                </BrowserRouter>
            </NotificationsProvider>
        </ModalsProvider>
    </MantineProvider>,
    document.getElementById("app")
);
