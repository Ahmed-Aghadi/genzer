import React, { useState, useEffect } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import {
    canisterId as ledgerCanisterId,
    createActor as createLegerActor,
} from "../../../declarations/ledger/index";
import { AuthClient } from "@dfinity/auth-client";

const BalanceContext = React.createContext({
    balance: 0,
    amountDeposited: 0,
    isFetching: true,
    fetched: false,
    refresh: async () => {},
});

export const BalanceContextProvider = (props) => {
    const [balance, setBalance] = useState();
    const [amountDeposited, setAmountDepostied] = useState();
    const [isFetching, setIsFetching] = useState(true);
    const [fetched, setFetched] = useState(false);

    useEffect(() => {
        refresh();
    }, []);

    const refresh = async () => {
        setIsFetching(true);
        const authClient = await AuthClient.create();
        if (!(await authClient.isAuthenticated())) {
            setIsFetching(false);
            return;
        }
        const identity = await authClient.getIdentity();

        const authenticatedGenzerCanister = createGenzerActor(
            genzerCanisterId,
            {
                agentOptions: {
                    identity,
                },
            }
        );
        const authenticatedLedgerCanister = createLegerActor(ledgerCanisterId, {
            agentOptions: {
                identity,
            },
        });

        const amountDeposited =
            await authenticatedGenzerCanister.getCanisterDepositAccountBalance();

        if (amountDeposited) {
            setAmountDepostied(amountDeposited.e8s.toString());
        } else {
            return;
        }

        // console.log("amountDeposited", amountDeposited.e8s.toString());

        const userPrincipal = identity.getPrincipal();
        // console.log("userPrincipal", userPrincipal.toText());
        const userAccountId =
            await authenticatedGenzerCanister.getDefaultAccountIdentifier(
                userPrincipal
            );
        // console.log("userAccountId", userAccountId);

        const userBalance = await authenticatedLedgerCanister.account_balance({
            account: userAccountId,
        });

        if (userBalance) {
            setFetched(true);
            setBalance(userBalance.e8s.toString());
        }

        // console.log("userBalance", userBalance.e8s.toString());
        // setBalance(userBalance);
        setIsFetching(false);
        return { balance: userBalance, amountDeposited: amountDeposited };
    };
    return (
        <BalanceContext.Provider
            value={{
                balance: balance,
                amountDeposited: amountDeposited,
                isFetching: isFetching,
                fetched: fetched,
                refresh: refresh,
            }}
        >
            {props.children}
        </BalanceContext.Provider>
    );
};

export default BalanceContext;
