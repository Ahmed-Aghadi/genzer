import React, { useContext, useState, useEffect } from "react";
import {
    canisterId as genzerCanisterId,
    createActor as createGenzerActor,
} from "../../../declarations/genzer_backend/index";
import {
    canisterId as ledgerCanisterId,
    createActor as createLegerActor,
} from "../../../declarations/ledger/index";
import { AuthClient } from "@dfinity/auth-client";
import BalanceContext from "./balanceContext";

const DepositContext = React.createContext({
    deposit: async (
        amount,
        disableAmountEdit,
        onClose,
        onTransferSuccess,
        onTransferFail
    ) => {},
    withdraw: async () => {},
    amount: 0,
    setAmount: () => {},
});
import {
    Button,
    Center,
    Text,
    Tooltip,
    TextInput,
    SimpleGrid,
} from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { Modal } from "@mantine/core";
import { showNotification, updateNotification } from "@mantine/notifications";
import { IconCloudUpload, IconX, IconDownload, IconCheck } from "@tabler/icons";

const icp_fee = 10000;

export const DepositContextProvider = (props) => {
    const balanceCtx = useContext(BalanceContext);
    const [depositOpened, setDepositOpened] = useState(false);
    const [withdrawOpened, setWithdrawOpened] = useState(false);
    const [amount, setAmount] = useState(0);
    const [disableAmountEdit, setDisableAmountEdit] = useState(false);
    const [onClose, setOnClose] = useState(() => {});
    const [onTransferSuccess, setOnTransferSuccess] = useState(() => {});
    const [onTransferFail, setOnTransferFail] = useState(() => {});
    // const [amountInput, setAmount] = useState(0);
    const [amountOpened, setAmountOpened] = useState(false);
    const amountValid = !!amount && Number.isInteger(amount) && amount > 0;

    const initiateTransfer = async () => {
        showNotification({
            id: "deposit-notification",
            loading: true,
            title: "Depositing",
            message:
                "Please wait while we deposit ledger tokens to the canister",
            autoClose: false,
            disallowClose: true,
        });

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
        const authenticatedLedgerCanister = createLegerActor(ledgerCanisterId, {
            agentOptions: {
                identity,
            },
        });

        const depositAddress =
            await authenticatedGenzerCanister.getDepositAddress();

        try {
            console.log(authenticatedLedgerCanister);
            const transfer = await authenticatedLedgerCanister.transfer({
                memo: 1,
                to: depositAddress,
                amount: { e8s: BigInt(amount) },
                fee: { e8s: BigInt(icp_fee) },
                from_subaccount: [],
                created_at_time: [],
            });
            console.log(transfer);
            updateNotification({
                id: "deposit-notification",
                color: "teal",
                title: "Deposited Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            });
            setDepositOpened(false);
            balanceCtx.refresh();
            await onTransferSuccess();
        } catch (error) {
            console.log("error", error);
            updateNotification({
                id: "deposit-notification",
                autoClose: 5000,
                title: "Transfer failed",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
            setDepositOpened(false);
            await onTransferFail();
        }
    };

    // const openModal = () =>
    //     openConfirmModal({
    //         title: "Please confirm your action",
    //         children: (
    //             <Text size="sm">
    //                 This action is so important that you are required to confirm
    //                 it with a modal. Please click one of these buttons to
    //                 proceed.
    //             </Text>
    //         ),
    //         labels: { confirm: "Confirm", cancel: "Cancel" },
    //         onCancel: () => console.log("Cancel"),
    //         onConfirm: () => console.log("Confirmed"),
    //     });

    const deposit = async (
        amountArg,
        disableAmountEditArg,
        onCloseArg,
        onTransferSuccessArg,
        onTransferFailArg
    ) => {
        console.log("depositing");
        setDepositOpened(true);
        if (Number.isInteger(parseInt(amountArg))) {
            amountArg = parseInt(amountArg);
        }
        if (!!amountArg && Number.isInteger(amountArg) && amountArg > 0) {
            setAmount(amountArg);
        }
        if (disableAmountEditArg) {
            setDisableAmountEdit(disableAmountEditArg);
        }

        // had to do like this because function was being called automatically
        setOnClose(() => {
            return onCloseArg ? () => onCloseArg() : () => {};
        });
        setOnTransferSuccess(() => {
            return onTransferSuccessArg
                ? () => onTransferSuccessArg()
                : () => {};
        });
        setOnTransferFail(() => {
            return onTransferFailArg ? () => onTransferFailArg() : () => {};
        });
    };

    const initiateWithdraw = async () => {
        showNotification({
            id: "withdraw-notification",
            loading: true,
            title: "Withdrawing...",
            message:
                "Please wait while we withdraw all your ledger tokens from the canister",
            autoClose: false,
            disallowClose: true,
        });

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
        const authenticatedLedgerCanister = createLegerActor(ledgerCanisterId, {
            agentOptions: {
                identity,
            },
        });

        try {
            console.log(authenticatedGenzerCanister);
            const withdraw = await authenticatedGenzerCanister.withdraw();
            console.log(withdraw);
            updateNotification({
                id: "withdraw-notification",
                color: "teal",
                title: "Withdrawn Successfully",
                icon: <IconCheck size={16} />,
                autoClose: 2000,
            });
            setWithdrawOpened(false);
            balanceCtx.refresh();
        } catch (error) {
            console.log("error", error);
            updateNotification({
                id: "withdraw-notification",
                autoClose: 5000,
                title: "Withdraw failed",
                message: "Check console for more details",
                color: "red",
                icon: <IconX />,
                className: "my-notification-class",
                loading: false,
            });
            setWithdrawOpened(false);
        }
    };

    const withdraw = async () => {
        console.log("withdrawing");
        setWithdrawOpened(true);
    };
    return (
        <DepositContext.Provider
            value={{
                deposit: deposit,
                withdraw: withdraw,
                amount: amount,
                setAmount: setAmount,
            }}
        >
            <Modal
                transition="fade"
                transitionDuration={350}
                transitionTimingFunction="ease"
                opened={withdrawOpened}
                onClose={() => {
                    setWithdrawOpened(false);
                }}
                title="Withdraw"
            >
                <Text size="xl" mb="md">
                    Do you want to withdraw all your ledger tokens from this
                    canister?
                </Text>
                <SimpleGrid cols={2}>
                    <Button
                        color="gray"
                        onClick={() => setWithdrawOpened(false)}
                    >
                        No
                    </Button>
                    <Button color="dark" onClick={() => initiateWithdraw()}>
                        Yes
                    </Button>
                </SimpleGrid>
            </Modal>
            <Modal
                transition="fade"
                transitionDuration={350}
                transitionTimingFunction="ease"
                opened={depositOpened}
                onClose={() => {
                    if (onClose) {
                        onClose();
                    }
                    setDepositOpened(false);
                }}
                title="Deposit"
            >
                <Tooltip
                    label={
                        amountValid
                            ? "All good!"
                            : "Amount should be greater than zero"
                    }
                    position="bottom-start"
                    withArrow
                    opened={amountOpened}
                    color={amountValid ? "teal" : undefined}
                >
                    <TextInput
                        label="Amount to deposit"
                        disabled={
                            disableAmountEdit == undefined
                                ? false
                                : disableAmountEdit
                        }
                        required
                        placeholder={"Amount to deposit to the canister"}
                        onFocus={() => setAmountOpened(true)}
                        onBlur={() => setAmountOpened(false)}
                        mt="md"
                        value={amount}
                        min={0}
                        step="1"
                        onChange={(event) => {
                            let value = 0;
                            if (
                                event.target.value == "" ||
                                !event.target.value
                            ) {
                                value = 0;
                                setAmount(value);
                            } else if (
                                Number.isInteger(parseInt(event.target.value))
                            ) {
                                value = parseInt(event.target.value);
                                setAmount(value);
                            }
                        }}
                    />
                </Tooltip>
                <Text size="sm">ICP Fees : {icp_fee} (not included)</Text>
                <Center>
                    <Button
                        variant="light"
                        color="orange"
                        radius="md"
                        size="sm"
                        mt="md"
                        onClick={async () => {
                            if (amountValid) {
                                initiateTransfer();
                            } else {
                                showNotification({
                                    id: "hello-there",
                                    // onClose: () => console.log("unmounted"),
                                    // onOpen: () => console.log("mounted"),
                                    autoClose: 5000,
                                    title: "Amount should be greater than zero",
                                    message: "Please enter a valid amount",
                                    color: "red",
                                    icon: <IconX />,
                                    className: "my-notification-class",
                                    loading: false,
                                });
                            }
                        }}
                    >
                        Deposit
                    </Button>
                </Center>
            </Modal>
            {props.children}
        </DepositContext.Provider>
    );
};

export default DepositContext;
