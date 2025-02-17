const express = require("express");
const router = express.Router();
const mainLayout = "../views/layouts/main.ejs";
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const axios = require("axios"); // 이미지 다운로드를 위한 모듈
const { dalle } = require("../openai");

router.get(["/", "/home"], asyncHandler(async (req, res) => {
    const locals = { title: "Home" };
    const data = await Post.find({}).sort({ createdAt: -1 });
    res.render("index", { locals, data, layout: mainLayout });
}));

router.get("/post/:id", asyncHandler(async (req, res) => {
    const data = await Post.findOne({ _id: req.params.id });

    // 이미지 바이너리를 Base64로 변환하여 뷰에서 표시
    let imageBase64 = null;
    if (data.image) {
        imageBase64 = `data:${data.contentType};base64,${data.image.toString("base64")}`;
    }

    res.render("post", { data, imageBase64, layout: mainLayout });
}));

// AI 이미지 생성 및 저장 (이미지 자체 저장)
router.get("/generate-image/:id", asyncHandler(async (req, res) => {
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

        const imageUrl = await dalle.text2im({ prompt });

        // 🔹 AI가 생성한 이미지 다운로드
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data, "binary");

        // 🔹 이미지 저장
        post.image = imageBuffer;
        post.contentType = response.headers["content-type"]; // 예: 'image/png'
        await post.save();

        res.json({ message: "이미지가 저장되었습니다" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "이미지 생성 중 오류 발생" });
    }
}));

router.get("/about", (req, res) => {
    res.render("about", { layout: mainLayout });
});

module.exports = router;
