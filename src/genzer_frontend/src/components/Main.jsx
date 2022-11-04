import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./Home";
import Profile from "./Profile";
import Upload from "./Upload";

function Main() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate replace to="/home" />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload" element={<Upload />} />
                {/* <Route path="/video/:id" element={<VideoPage />} />
                <Route path="/messages" element={<Chat />} /> */}
            </Routes>
        </>
    );
}

export default Main;