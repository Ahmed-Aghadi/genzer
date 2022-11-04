import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Nat "mo:base/Nat";
import Random "mo:base/Random";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Account   "./Account";
import Text "mo:base/Text";
import Blob      "mo:base/Blob";
import Array "mo:base/Array";
import NFTActorClass "./nft/NFToken";
import Cycles "mo:base/ExperimentalCycles";
import Iter "mo:base/Iter";
import HashMap "mo:base/HashMap";
import Types "./nft/types";
import Ledger "canister:ledger";

actor Self{

    type TokenMetadata = Types.TokenMetadata;
    type SubAccount = Blob;
    
    public type Errors = {
        #Unauthorized;
        #TokenNotExist;
        #InvalidOperator;
    };

    public type MintResult = {
        #Ok: (Nat, Nat);
        #Err: Errors;
    };

    stable var currentValue: Nat = 0;
    let icp_fee: Nat = 10_000;
    let post_fee: Nat = 50_000;

    // postPrincipal to userPrincipal
    private var postToUser = HashMap.HashMap<Principal, Principal>(1, Principal.equal, Principal.hash);
    // let ledger : Principal = Principal.fromActor(Ledger);
    // Debug.print(" LEDGER: " # Principal.toText(ledger));

    // canister takes 10% of mintFee when minted + icp_fee for transfer to user + icp_fee for transfer to canister default account
    public shared(msg) func addPost( logo: [Text], name: Text, symbol: Text, desc: Text, mintFee: Nat) : async Bool {
        if((mintFee * 90) / 100 <= 2 * icp_fee) { // user should get atleast more than 2 * icp_fee
            return false;
        };
        if (await transferFromSubAccountToDefaultAccount_(msg.caller, post_fee, post_fee)) {
            return false;
        };
        Debug.print("Cycles Balance" # debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000);
        Debug.print("Cycles Balance" # debug_show(Cycles.balance()));
        let postNFT = await NFTActorClass.NFToken(logo, name, symbol, desc, Principal.fromActor(Self), mintFee);
        let postPrincipal:Principal = Principal.fromActor(postNFT);
        postToUser.put(postPrincipal, msg.caller);
        return true;
    };
    
    public shared(msg) func mintPost( postPrincipal: Principal) : async Bool {
        let postNFT = actor(Principal.toText(postPrincipal)): actor { mint: (Principal,TokenMetadata) -> async MintResult; logosLength: () -> async Nat; mintFee: () -> async Nat; };
        let mintFee = await postNFT.mintFee();
        if (await transferFromSubAccountToDefaultAccount_(msg.caller, (((mintFee * 90) / 100) - icp_fee) , mintFee)) {
            return false;
        };
        if (await transferFromSubAccountToDefaultAccount_(msg.caller, ((mintFee * 10 / 100) + icp_fee), mintFee * 10 / 100)) {
            return false;
        };
        let randomNumber = await getRandom();
        let lengthOfLogos = await postNFT.logosLength();
        Debug.print("lengthOfLogos: " # debug_show(lengthOfLogos));
        Debug.print("randomNumber: " # debug_show(randomNumber));
        let index = randomNumber % lengthOfLogos;
        Debug.print("index: " # debug_show(index));
        let res = await postNFT.mint(msg.caller, {logoIndex = index});
        return true;
    };

    // balanceCheck will be used to check wheter the user has deposit enough balance to mint the token
    // return true if transfer success else for all other cases return false
    func transferFromSubAccountToDefaultAccount_(caller: Principal, amount: Nat, balanceCheck: Nat) : async Bool {
        // if (amount < icp_fee) {
        //     return false;
        // };
        let subAccount = Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(caller));
        Debug.print("SubAccountIdentifier: " # Text.replace(debug_show(subAccount), #text("\\"), ""));
        let balance = await Ledger.account_balance({ account = subAccount });
        Debug.print("Balance: " # debug_show(balance));
        if (Nat64.toNat(balance.e8s) < balanceCheck) {
            return false;
        };
        let to = myAccountId();
        let memo:Nat64 = 1;
        let fee = Nat64.fromNat(icp_fee);
        // let res = await Ledger.transfer({amount = {e8s = 20_000}; fee = {e8s = fee}; from_subaccount = ?from; to = to; memo = memo; created_at_time = null});
        if (Nat64.toNat(balance.e8s) > icp_fee) {
             let icp_receipt = await Ledger.transfer({
                memo: Nat64    = memo;
                from_subaccount = ?Account.principalToSubaccount(caller);
                to = to;
                amount = { e8s = Nat64.fromNat(amount) - Nat64.fromNat(icp_fee)};
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });
            switch icp_receipt {
                case ( #Err _) {
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

    public query func getPosts() : async [Principal] {
        return Iter.toArray(postToUser.keys());
    };

    public query func getPostToUsers(): async [(Principal, Principal)] {
        return Iter.toArray(postToUser.entries());
    };

    
    public query func getUserPosts(user: Principal) : async [Principal] {
        let postToUserEntries = Iter.toArray(postToUser.entries());
        var userPosts:[Principal] = [];
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

    public query func getPostOwner(postPrincipal: Principal) : async Principal {
        let postOwner = postToUser.get(postPrincipal);
        switch postOwner {
            case null { return Principal.fromText("null"); };
            case (?postOwner) { return postOwner; };
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
        Account.accountIdentifier(Principal.fromActor(Self), Account.defaultSubaccount())
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
        let accountIdentifierText = debug_show(myAccountId());
        Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
        await Ledger.account_balance({ account = myAccountId() })
    };

    // // Returns current balance on the default account of this canister.
    // public shared(msg) func canisterSubAccountBalance() : async Ledger.Tokens {
    //     let accountIdentifierText = debug_show(myAccountId());
    //     Debug.print("AccountIdentifier: " # Text.replace(accountIdentifierText, #text("\\"), ""));
    //     await Ledger.account_balance({ account = await getCanisterSubAccountAccountIdentifier_(msg.caller) })
    // };

    public func getCanisterAccountIdentifier() : async Account.AccountIdentifier {
        myAccountId()
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

    public shared(msg) func getDepositAddress(): async Account.AccountIdentifier {
        Account.accountIdentifier(Principal.fromActor(Self), Account.principalToSubaccount(msg.caller));
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

    func getRandom(): async Nat {
        let entropy = await Random.blob(); // get initial entropy
        var f = Random.Finite(entropy);
        var genNumber = f.range(8); // 0 to 2^8 - 1
        return switch(genNumber){
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
};
