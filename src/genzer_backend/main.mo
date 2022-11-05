import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Random "mo:base/Random";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Account "./Account";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import NFTActorClass "./nft/NFToken";
import Cycles "mo:base/ExperimentalCycles";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Types "./nft/types";
import Ledger "canister:ledger";

actor Self {

    type TokenMetadata = Types.TokenMetadata;
    type SubAccount = Blob;

    public type Errors = {
        #Unauthorized;
        #TokenNotExist;
        #InvalidOperator;
    };

    public type MintResult = {
        #Ok : (Nat, Nat);
        #Err : Errors;
    };

    public type ErrorsForMint = {
        #NotEnoughBalance;
        #Unauthorized;
        #TokenNotExist;
        #InvalidOperator;
        #MaxSupplyReached;
        #OwnerNotSet; // should never happen
    };

    public type MintRes = {
        #Ok : Nat; // tokenId
        #Err : ErrorsForMint;
    };

    public type UserNFT = {
        NFT : Principal; // NFTcanisterId = PostCanisterId
        tokenId : Nat;
    };

    let icp_fee : Nat = 10_000;
    let post_fee : Nat = 50_000;

    private var nftToToken = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);

    private stable var nftSuppliedEntries : [(Principal, Nat)] = [];
    // userPrincipal to UserNFT that is userPrincipal -> [NFTcanisterId, tokenId] ( same as userPrincipal -> [PostCanisterId, tokenId] )
    private var nftSupplied = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);

    private stable var nftToMaxSupplyEntries : [(Principal, Nat)] = [];
    // userPrincipal to UserNFT that is userPrincipal -> [NFTcanisterId, tokenId] ( same as userPrincipal -> [PostCanisterId, tokenId] )
    private var nftToMaxSupply = HashMap.HashMap<Principal, Nat>(0, Principal.equal, Principal.hash);

    private stable var userToNFTEntries : [(Principal, [UserNFT])] = [];
    // userPrincipal to UserNFT that is userPrincipal -> [NFTcanisterId, tokenId] ( same as userPrincipal -> [PostCanisterId, tokenId] )
    private var userToNFT = HashMap.HashMap<Principal, [UserNFT]>(0, Principal.equal, Principal.hash);

    private stable var postToUserEntries : [(Principal, Principal)] = [];
    // postPrincipal to userPrincipal
    private var postToUser = HashMap.HashMap<Principal, Principal>(0, Principal.equal, Principal.hash);
    // let ledger : Principal = Principal.fromActor(Ledger);
    // Debug.print(" LEDGER: " # Principal.toText(ledger));

    // at max 5 images per post
    // canister takes 10% of mintFee when minted + icp_fee for transfer to user + icp_fee for transfer to canister default account
    public shared (msg) func addPost(logo : [Text], name : Text, symbol : Text, desc : Text, mintFee : Nat, maxSupply : Nat) : async Bool {
        if (logo.size() == 0 and logo.size() > 5) {
            return false;
        };
        if ((mintFee * 90) / 100 <= 2 * icp_fee) {
            // user should get atleast more than 2 * icp_fee
            return false;
        };
        if (not (await transferFromSubAccount_(msg.caller, post_fee - icp_fee, post_fee, myAccountId()))) {
            return false;
        };
        Debug.print("Cycles Balance" # debug_show (Cycles.balance()));
        Cycles.add(100_500_000_000);
        Debug.print("Cycles Balance" # debug_show (Cycles.balance()));
        let postNFT = await NFTActorClass.NFToken(logo, name, symbol, desc, Principal.fromActor(Self), mintFee);
        let postPrincipal : Principal = Principal.fromActor(postNFT);
        nftToMaxSupply.put(postPrincipal, maxSupply);
        postToUser.put(postPrincipal, msg.caller);
        return true;
    };

    public shared (msg) func mintPost(postPrincipal : Principal) : async MintRes {
        let postNFT = actor (Principal.toText(postPrincipal)) : actor {
            mint : (Principal, TokenMetadata) -> async MintResult;
            logosLength : () -> async Nat;
            mintFee : () -> async Nat;
            totalSupply : () -> async Nat;
        };
        let mintFee = await postNFT.mintFee();
        if (nftSupplied.get(postPrincipal) == nftToMaxSupply.get(postPrincipal)) {
            return #Err(#MaxSupplyReached);
        };
        let postOwner = switch (postToUser.get(postPrincipal)) {
            case (null) return #Err(#OwnerNotSet);
            case (?p) p;
        };
        let amountToCanister = (mintFee * 10) / 100;
        let amountToUser = mintFee - amountToCanister - 2 * icp_fee;
        if (not (await transferFromSubAccount_(msg.caller, amountToCanister, mintFee, myAccountId()))) {
            return #Err(#NotEnoughBalance);
        };
        Debug.print("Transfered to canister");
        if (not (await transferFromSubAccount_(msg.caller, amountToUser, amountToUser + icp_fee, Account.accountIdentifier(postOwner, Account.defaultSubaccount())))) {
            return #Err(#NotEnoughBalance);
        };
        Debug.print("Transfered to user");
        // increment nftSupplied
        nftSupplied.put(
            postPrincipal,
            switch (nftSupplied.get(postPrincipal)) {
                case (null) 1;
                case (?x) x + 1;
            },
        );
        let randomNumber = await getRandom();
        let lengthOfLogos = await postNFT.logosLength();
        Debug.print("lengthOfLogos: " # debug_show (lengthOfLogos));
        Debug.print("randomNumber: " # debug_show (randomNumber));
        let index = randomNumber % lengthOfLogos;
        Debug.print("index: " # debug_show (index));
        let res = await postNFT.mint(msg.caller, { logoIndex = index });
        Debug.print("res: " # debug_show (res));
        switch res {
            case (#Ok(tokenIndex : Nat, txId : Nat)) {
                let userNFT = { NFT = postPrincipal; tokenId = tokenIndex };
                let userNFTs = userToNFT.get(msg.caller);
                switch userNFTs {
                    case (null) {
                        userToNFT.put(msg.caller, [userNFT]);
                    };
                    case (?userNFTs) {
                        userToNFT.put(msg.caller, Array.append(userNFTs, [userNFT]));
                    };
                };
                return #Ok(tokenIndex);
            };
            case (#Err(err : Errors)) {
                // increment nftSupplied
                nftSupplied.put(
                    postPrincipal,
                    switch (nftSupplied.get(postPrincipal)) {
                        case (null) 0;
                        case (?x) x - 1;
                    },
                );
                return #Err(err);
            };
        };
    };

    // balanceCheck will be used to check wheter the user has deposit enough balance to mint the token
    // will transfer the amount to the canister and not deduct icp_fee from amount
    // return true if transfer success else for all other cases return false
    func transferFromSubAccount_(caller : Principal, amount : Nat, balanceCheck : Nat, to : Account.AccountIdentifier) : async Bool {
        // if (amount < icp_fee) {
        //     return false;
        // };
        let subAccount = Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(caller));
        Debug.print("SubAccountIdentifier: " # Text.replace(debug_show (subAccount), #text("\\"), ""));
        let balance = await Ledger.account_balance({ account = subAccount });
        Debug.print("Balance: " # debug_show (balance));
        Debug.print("Amount: " # debug_show (amount));
        Debug.print("BalanceCheck: " # debug_show (balanceCheck));

        if (Nat64.toNat(balance.e8s) < balanceCheck) {
            return false;
        };

        Debug.print("Balance is enough");

        // let to = myAccountId();
        let memo : Nat64 = 1;
        let fee = Nat64.fromNat(icp_fee);
        // let res = await Ledger.transfer({amount = {e8s = 20_000}; fee = {e8s = fee}; from_subaccount = ?from; to = to; memo = memo; created_at_time = null});
        if (Nat64.toNat(balance.e8s) > icp_fee) {
            let icp_receipt = await Ledger.transfer({
                memo : Nat64 = memo;
                from_subaccount = ?Account.principalToSubaccount(caller);
                to = to;
                amount = {
                    e8s = Nat64.fromNat(amount);
                };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{
                    timestamp_nanos = Nat64.fromNat(Int.abs(Time.now()));
                };
            });
            Debug.print("res: " # debug_show (icp_receipt));
            switch icp_receipt {
                case (#Err _) {
                    return false;
                };
                case _ {};
            };
            return true;
        } else {
            return false;
        };
    };

    // public func getLogos(postPrincipal: Principal): async [Text] {
    //     let postNFT = actor(Principal.toText(postPrincipal)): actor { logos: () -> async [Text] };
    //     return await postNFT.logos();
    // };

    public shared ({ caller }) func withdraw() : async Bool {
        let subAccount = Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(caller));
        let balance = await Ledger.account_balance({ account = subAccount });
        // let to = Account.accountIdentifier(caller, Account.defaultSubaccount());
        // let memo : Nat64 = 1;
        // let fee = Nat64.fromNat(icp_fee);
        let res = await transferFromSubAccount_(caller, (Nat64.toNat(balance.e8s) - icp_fee), icp_fee, Account.accountIdentifier(caller, Account.defaultSubaccount()));
        // let res = await Ledger.transfer({
        //     amount = { e8s = balance.e8s - fee };
        //     fee = { e8s = fee };
        //     from_subaccount = ?subAccount;
        //     to = to;
        //     memo = memo;
        //     created_at_time = null;
        // });
        return res;
    };

    public query func getPosts() : async [Principal] {
        return Iter.toArray(postToUser.keys());
    };

    public query func getPostToUsers() : async [(Principal, Principal)] {
        return Iter.toArray(postToUser.entries());
    };

    public query func getUsersToNFTs() : async [(Principal, [UserNFT])] {
        return Iter.toArray(userToNFT.entries());
    };

    public query func getUserNFTs(userPrincipal : Principal) : async [UserNFT] {
        switch (userToNFT.get(userPrincipal)) {
            case (null) {
                return [];
            };
            case (?nft) {
                return nft;
            };
        };
    };

    public query func getNFTsToMaxSupply() : async [(Principal, Nat)] {
        return Iter.toArray(nftToMaxSupply.entries());
    };

    public query func getNFTMaxSupply(nftPrincipal : Principal) : async Nat {
        switch (nftToMaxSupply.get(nftPrincipal)) {
            case (null) {
                return 0;
            };
            case (?maxSupply) {
                return maxSupply;
            };
        };
    };

    public query func getNFTsSupplied() : async [(Principal, Nat)] {
        return Iter.toArray(nftSupplied.entries());
    };

    public query func getNFTSupplied(nftPrincipal : Principal) : async Nat {
        switch (nftSupplied.get(nftPrincipal)) {
            case (null) {
                return 0;
            };
            case (?maxSupply) {
                return maxSupply;
            };
        };
    };

    public query func getUserPosts(user : Principal) : async [Principal] {
        let postToUserEntries = Iter.toArray(postToUser.entries());
        var userPosts : [Principal] = [];
        for ((postPrincipal, postUser) in postToUserEntries.vals()) {
            if (user == postUser) {
                userPosts := Array.append<Principal>(userPosts, [postPrincipal]);
            };
        };
        return userPosts;
    };

    // public query func getUserPostsCount(user: Principal) : async Nat {
    //     let posts = userToPostPrincipal.get(user);
    //     switch posts {
    //         case null { return 0; };
    //         case (?posts) { return posts.size(); };
    //     };
    // };

    public query func getPostOwner(postPrincipal : Principal) : async Principal {
        let postOwner = postToUser.get(postPrincipal);
        switch postOwner {
            case null { return Principal.fromText("null") };
            case (?postOwner) { return postOwner };
        };
    };

    // public query func getUserPost(user: Principal, index: Nat) : async Principal {
    //     let posts = userToPostPrincipal.get(user);
    //     switch posts {
    //         case null { return 0; };
    //         case (?posts) { return posts[index]; };
    //     };
    // };

    // public func increment(): async () {
    //     currentValue += 1;
    // };

    // public query func getValue(): async Nat {
    //     currentValue;
    // };

    // Returns the default account identifier of this canister.
    func myAccountId() : Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(Self), Account.defaultSubaccount());
    };

    // public shared({caller}) func transferFromSubAccountToDefaultAccount() : async Ledger.TransferResult {
    //     Debug.print("transferFromSubAccountToDefaultAccount");
    //     let from = Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(caller));
    //     Debug.print("SubAccountIdentifier: " # Text.replace(debug_show(from), #text("\\"), ""));
    //     let balance = await Ledger.account_balance({ account = from });
    //     Debug.print("Balance: " # debug_show(balance));
    //     let to = myAccountId();
    //     let memo:Nat64 = 1;
    //     let fee = Nat64.fromNat(icp_fee);
    //     // let res = await Ledger.transfer({amount = {e8s = 20_000}; fee = {e8s = fee}; from_subaccount = ?from; to = to; memo = memo; created_at_time = null});
    //     let res = await Ledger.transfer({
    //             memo: Nat64    = memo;
    //             from_subaccount = ?Account.principalToSubaccount(caller);
    //             to = to;
    //             amount = { e8s = balance.e8s - Nat64.fromNat(icp_fee)};
    //             fee = { e8s = Nat64.fromNat(icp_fee) };
    //             created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
    //         });
    //     Debug.print("transferFromSubAccountToDefaultAccount: " # debug_show(res));
    //     return res;
    // };

    // Returns current balance on the default account of this canister.
    public func canisterBalance() : async Ledger.Tokens {
        let accountIdentifierText = debug_show (myAccountId());
        Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
        await Ledger.account_balance({ account = myAccountId() });
    };

    public shared (msg) func getCanisterDepositAccountBalance() : async Ledger.Tokens {
        let accountIdentifier = Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(msg.caller));
        let accountIdentifierText = debug_show (accountIdentifier);
        Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
        await Ledger.account_balance({ account = accountIdentifier });
    };

    // // Returns current balance on the default account of this canister.
    // public shared(msg) func canisterSubAccountBalance() : async Ledger.Tokens {
    //     let accountIdentifierText = debug_show(myAccountId());
    //     Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
    //     await Ledger.account_balance({ account = await getCanisterSubAccountAccountIdentifier_(msg.caller) })
    // };

    public func getCanisterAccountIdentifier() : async Account.AccountIdentifier {
        myAccountId();
    };

    public func getDefaultAccountIdentifier(caller : Principal) : async Account.AccountIdentifier {
        Debug.print("UserAccountIdentifier: " # Text.replace(debug_show (Account.accountIdentifier(caller, Account.defaultSubaccount())), #text("\\"), ""));
        Account.accountIdentifier(caller, Account.defaultSubaccount());
    };

    // func getCanisterSubAccountAccountIdentifier_(caller:Principal) : async Account.AccountIdentifier {
    //     Debug.print("SubAccountIdentifier: " # Text.replace(debug_show(Account.accountIdentifier(Principal.fromActor(Self), Principal.toBlob(caller))), #text("\\"), ""));
    //     Account.accountIdentifier(Principal.fromActor(Self), Principal.toBlob(caller))
    // };

    // public shared({caller})func getCanisterSubAccountAccountIdentifier() : async Account.AccountIdentifier {
    //   let SubAccountIdentifier = Account.accountIdentifier(Principal.fromActor(Self), Principal.toBlob(caller));
    //   Debug.print("SubAccountIdentifier: " # Text.replace(debug_show(SubAccountIdentifier), #text("\\"), ""));
    //   return SubAccountIdentifier
    // };

    public shared (msg) func getDepositAddress() : async Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(msg.caller));
    };

    public query func amountGetFromMint(mintFee : Nat) : async Nat {
        let amountToCanister = (mintFee * 10) / 100 + 2 * icp_fee;
        let amountToUser = mintFee - amountToCanister;
        return amountToUser;
        // (((mintFee * 90) / 100) - 2 * icp_fee);
    };

    public query func minMintFee() : async Nat {
        ((2 * icp_fee * 100) / 90);
    };

    // public shared(msg) func getDepositAddressText(): async Text {
    //     await AccountIdentifierToText(Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(msg.caller)));
    // };

    // // Returns current balance on the user.
    // public shared(msg) func getUserBalance() : async Ledger.Tokens {
    //     let accountIdentifier = Account.accountIdentifier(msg.caller, Account.defaultSubaccount());

    //     // convert accountIdentifier to text
    //     let accountIdentifierText = debug_show(accountIdentifier);
    //     Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
    //     await Ledger.account_balance({ account = accountIdentifier })
    // };

    // public query func AccountIdentifierToText(accountIdentifier: Account.AccountIdentifier) : async Text {
    //     Text.replace(debug_show(accountIdentifier), #text("\\"), "");
    // };

    func getRandom() : async Nat {
        let entropy = await Random.blob(); // get initial entropy
        var f = Random.Finite(entropy);
        var genNumber = f.range(8); // 0 to 2^8 - 1
        return switch (genNumber) {
            case (null) 0;
            case (?Nat) Nat;
        };
    };

    /////////////////////////////////////////////

    //   public func greet(name : Text) : async Text {
    //     return "Hello, " # name # "!";
    //   };

    //   public shared query(msg) func getPrincipal() : async Text {
    //     Debug.print(Principal.toText(msg.caller));
    //     return Principal.toText(msg.caller)
    //   };

    system func preupgrade() {
        postToUserEntries := Iter.toArray(postToUser.entries());
        userToNFTEntries := Iter.toArray(userToNFT.entries());
        nftToMaxSupplyEntries := Iter.toArray(nftToMaxSupply.entries());
        nftSuppliedEntries := Iter.toArray(nftSupplied.entries());
    };

    system func postupgrade() {
        postToUser := HashMap.fromIter<Principal, Principal>(postToUserEntries.vals(), 1, Principal.equal, Principal.hash);
        userToNFT := HashMap.fromIter<Principal, [UserNFT]>(userToNFTEntries.vals(), 1, Principal.equal, Principal.hash);
        nftToMaxSupply := HashMap.fromIter<Principal, Nat>(nftToMaxSupplyEntries.vals(), 1, Principal.equal, Principal.hash);
        nftSupplied := HashMap.fromIter<Principal, Nat>(nftSuppliedEntries.vals(), 1, Principal.equal, Principal.hash);
    };
};
