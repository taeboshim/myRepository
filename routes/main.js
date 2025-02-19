const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const { dalle } = require("../openai");

// 🔹 mainLayout 변수 정의
const mainLayout = "../views/layouts/main.ejs";

router.get(["/", "/home"], asyncHandler(async (req, res) => {
    const locals = { title: "Home" };
    const data = await Post.find({}).sort({ createdAt: -1 });
    res.render("index", { locals, data, layout: mainLayout });
}));

router.get("/post/:id", asyncHandler(async (req, res) => {
    const data = await Post.findOne({ _id: req.params.id });
    res.render("post", { data, layout: mainLayout });
}));

// 🔹 AI 이미지 생성 및 저장 (이미지를 파일로 저장하고, DB에는 Buffer 데이터 저장)
router.get("/generate-image/:id", asyncHandler(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시물을 찾을 수 없습니다" });
        }

        // 🔹 기존 이미지가 있으면 API 호출 없이 제공
        if (post.image) {
            return res.json({ message: "이미 이미지가 저장되어 있습니다." });
        }

        // 🔹 DALL·E API를 호출하여 이미지 생성
        const prompt = `Create a visually stunning and contextually accurate image based on the post: "${post.title}".`;
        const dalleResponse = await dalle.text2im({ prompt });
        const imageUrl = dalleResponse;

        // 🔹 AI 이미지 다운로드
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const imageBuffer = imageResponse.data;

        // 🔹 저장할 파일 경로 설정
        const imageFileName = `post_${post._id}.jpg`;
        const imagePath = path.join(__dirname, "../public/uploads", imageFileName);

        // 🔹 이미지 변환 및 저장 (.jpg 변환)
        const jpgBuffer = await sharp(imageBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();

        // 🔹 변환된 이미지 파일을 `uploads` 폴더에 저장
        fs.writeFileSync(imagePath, jpgBuffer);

        // 🔹 변환된 이미지 데이터를 DB에 저장 (Binary)
        post.image = jpgBuffer;
        await post.save();

        res.json({ message: "이미지가 저장되었습니다.", imagePath: `/uploads/${imageFileName}` });
    } catch (error) {
        console.error("❌ 이미지 생성 및 저장 중 오류:", error);
        res.status(500).json({ message: "이미지 생성 중 오류 발생" });
    }
}));

// 🔹 DB에서 이미지 파일을 제공하는 엔드포인트 추가
router.get("/image/:id", asyncHandler(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || !post.image) {
            return res.status(404).json({ message: "이미지가 없습니다." });
        }

        res.set("Content-Type", "image/jpeg");
        res.send(post.image);  // 🔹 Binary 데이터 응답
    } catch (error) {
        console.error("❌ 이미지 제공 중 오류:", error);
        res.status(500).json({ message: "이미지를 불러오는 중 오류 발생" });
    }
}));

// 🔹 정적 파일 제공 (저장된 이미지 서빙)
router.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

router.get("/about", (req, res) => {
    res.render("about", { layout: mainLayout });
});

module.exports = router;
    