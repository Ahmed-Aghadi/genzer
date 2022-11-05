import React, { useContext, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import Home from "./Home";
import Profile from "./Profile";
import Upload from "./Upload";
import PostPage from "./PostPage";
import BalanceContext from "../context/balanceContext";
import NFTPage from "./NFTPage";

function Main() {
    const location = useLocation();
    const balanceCtx = useContext(BalanceContext);
    useEffect(() => {
        balanceCtx.refresh();
    }, [location.pathname]);
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate replace to="/home" />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/upload" element={<Upload />} />

                {/* show a particular post | id = canister id of post */}
                <Route path="/post/:id" element={<PostPage />} />

                {/* show all nfts of a particular post which are minted | id = canister id of post */}
                {/* <Route path="/nft/:id" element={<PostNFTs />} /> */}

                {/* show a particular nft | id = canister id of post that is of nft as post and nft are used here interchangeably */}
                <Route path="/nft/:id/:tokenId" element={<NFTPage />} />

                {/* <Route path="/video/:id" element={<VideoPage />} />
                <Route path="/messages" element={<Chat />} /> */}
            </Routes>
        </>
    );
}

export default Main;
