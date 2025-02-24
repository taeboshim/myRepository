const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const { dalle } = require("../openai");

const mainLayout = "../views/layouts/main.ejs";
const mainLayout2 = "../views/layouts/main2.ejs"; // 로그인 후 레이아웃 추가

router.get(["/", "/home"], asyncHandler(async(req, res) => {
    const locals = { title: "Home" };
    const data = await Post.find({}).sort({ createdAt: -1 });

    // 🔹 로그인 여부 확인 후 사용자 정보 전달
    if (req.session && req.session.user) {
        res.render("index", { locals, data, user: req.session.user, layout: mainLayout2 });
    } else {
        res.render("index", { locals, data, user: null, layout: mainLayout });
    }
}));

router.get("/post/:id", asyncHandler(async(req, res) => {
    const data = await Post.findOne({ _id: req.params.id });

    // 이미지 바이너리를 Base64로 변환하여 뷰에서 표시
    let imageBase64 = null;
    if (data.image) {
        imageBase64 = `data:${data.contentType};base64,${data.image.toString("base64")}`;
    }

    res.render("post", { data, imageBase64, layout: mainLayout });
}));

// 🔹 AI 이미지 생성 및 저장 (이미지를 파일로 저장하고, DB에는 Buffer 데이터 저장)
router.get("/generate-image/:id", asyncHandler(async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시물을 찾을 수 없습니다" });
        }

        // 🔹 이미지가 이미 존재하면 API 호출 없이 반환
        if (post.image) {
            return res.json({ message: "이미지가 이미 존재합니다" });
        }

        // 🔹 AI 이미지 생성 요청
        const prompt = `Create a visually stunning and contextually accurate image based on the post: "${post.title}". 
Illustrate a scene that best represents the main idea, highlighting key themes and emotions from the text: "${post.body}". 
Incorporate essential elements that define the atmosphere and narrative of the post, ensuring an engaging and artistic depiction.
Avoid using any text, words, or letter-like symbols. Allow for abstract symbols like arrows or icons if necessary.`;

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
router.get("/image/:id", asyncHandler(async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post || !post.image) {
            return res.status(404).json({ message: "이미지가 없습니다." });
        }

        res.set("Content-Type", "image/jpeg");
        res.send(post.image); // 🔹 Binary 데이터 응답
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