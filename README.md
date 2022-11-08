# genzer

A social platform for **GenZ** where users can upload post, mint a post and earn when someone else mint their post. There is a post fee which user have to pay using _ledger tokens_. They can upload upto 5 images per post & can assign mint fee and total supply for their NFTs of their post. When a user mint a post, they have to pay corresponding ledger tokens and will randomly get any of the post image as an NFT. Some NFTs may become rare considering finite supply and randomly image assignment for NFTs.

This project uses of [IC-NFT](https://github.com/rocklabs-io/ic-nft)

|                     Table of contents                     |
| :-------------------------------------------------------: |
|    [Local Development Setup](#local-development-setup)    |
| [Sending Test Ledger Tokens](#sending-test-ledger-tokens) |

## Local Development Setup

(Assuming you've installed Canister SDK called dfx, which is the default SDK maintained by the DFINITY foundation. if not, checkout [Local development](https://internetcomputer.org/docs/current/developer-docs/quickstart/local-quickstart))

For first time, you need to start with fresh new development

### Start with fresh new deployement

First we need to start the replica :

With this command, you can't use this terminal, you've to use other terminal to write further commands:

```bash
dfx start

```

OR

If you want to use same terminal then start the replica in background:

```bash

dfx start --background
```

You won't be able to see debug statements in your terminal if you run dfx in background

Now we'll install ledger canister, we need to do this everytime we want to start a fresh new deployement locally.

You can also refer [Ledger Local Setup](https://internetcomputer.org/docs/current/developer-docs/integrations/ledger/ledger-local-setup/) from official docs if you want.

Replace ledger canister section from dfx.json

```
"ledger": {
            "type": "custom",
            "candid": "ledger.public.did",
            "wasm": "ledger.wasm",
            "remote": {
                "candid": "ledger.public.did",
                "id": {
                    "ic": "ryjl3-tyaaa-aaaaa-aaaba-cai"
                }
            }
        }
```

To :

```
"ledger": {
            "type": "custom",
            "candid": "ledger.private.did",
            "wasm": "ledger.wasm"
        }
```

now run this commands:

```bash
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx ledger account-id)

dfx identity use default
export LEDGER_ACC=$(dfx ledger account-id)

dfx deploy ledger --argument '(record {minting_account = "'${MINT_ACC}'"; initial_values = vec { record { "'${LEDGER_ACC}'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'

dfx identity use default
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

dfx deploy ledger --argument '(record {minting_account = "'${MINT_ACC}'"; initial_values = vec { record { "'${LEDGER_ACC}'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}; archive_options = opt record { trigger_threshold = 2000; num_blocks_to_archive = 1000; controller_id = principal "'${ARCHIVE_CONTROLLER}'" }})'
```

Now again replace ledger canister section dfx.json:

```
"ledger": {
            "type": "custom",
            "candid": "ledger.private.did",
            "wasm": "ledger.wasm"
        }
```

To :

```
"ledger": {
            "type": "custom",
            "candid": "ledger.public.did",
            "wasm": "ledger.wasm",
            "remote": {
                "candid": "ledger.public.did",
                "id": {
                    "ic": "ryjl3-tyaaa-aaaaa-aaaba-cai"
                }
            }
        }
```

Run this command to check that the Ledger canister is healthy:

```bash
dfx canister call ledger account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$LEDGER_ACC'")]) + "}")')' })'
```

Output should be:

> (record { e8s = 100_000_000_000 : nat64 })

Now run this command to deploy all the canisters locally:

```bash
dfx deploy
```

You can now see the canister id of all the canisters in the terminal. Replaced canister id of internet identity on [App.jsx](https://github.com/Ahmed-Aghadi/genzer/blob/main/src/genzer_frontend/src/App.jsx#L67)

from

```bash
"http://rno2w-sqaaa-aaaaa-aaacq-cai.localhost:8000/",
```

```bash
`http://${your_internet_identity_canister_id}.localhost:8000/`,
```

Now we'll then start the frontend :

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 8000.

### Start without fresh new deployement

If you've already deployed this project locally once and don't want to start a fresh new deployement then run these commands:

Start the replica:

```bash
dfx start # can't use this terminal for further commands
#or
dfx start --background # can use same terminal for further commands
```

then run:

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 8000.

## Sending Test Ledger Tokens

You had deployed Ledger canister and Internet Identity canister locally, so when we will connect our internet identity (using locally deployed internet identity canister), you can see your Account Identity on terminal as

```
[Canister r7inp-6aaaa-aaaaa-aaabq-cai] UserAccountIdentifier: "1DD301B8569225C5C4B210CAA52582090153FF3AE6FC64E5705C58D9342730AA"
```

( you cann see this on the terminal you ran `dfx start`, incase of running replica in the background you can't see debug prints ).

Now, to send `200_000_000_000` test ledger tokens to your account run:

```bash
dfx identity use minter
```

> Transfers from the minting account will create Mint transactions. Transfers to the minting account will create Burn transactions.

then run:

```bash
# replace '$LEDGER_ACC' with your account identity

dfx canister call ledger transfer '(record { to = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$LEDGER_ACC'")]) + "}")')'; memo = 1; amount = record { e8s = 200_000_000_000 }; fee = record { e8s = 0 }; })'
```

For example, if your account identity is `1DD301B8569225C5C4B210CAA52582090153FF3AE6FC64E5705C58D9342730AA`, then you have to run:

```bash
dfx canister call ledger transfer '(record { to = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("1DD301B8569225C5C4B210CAA52582090153FF3AE6FC64E5705C58D9342730AA")]) + "}")')'; memo = 1; amount = record { e8s = 200_000_000_000 }; fee = record { e8s = 0 }; })'
```

You'll see something like thisa as output on the terminal:

```
(variant { Ok = 24 : nat64 })
```

Now shift to your default account by running this command:

```
dfx identity use default
```

### Creating a post

Visit `http://localhost:8080`, and click on plus button on the left navigation bar:
