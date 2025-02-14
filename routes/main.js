const express = require("express");
const router = express.Router();
const mainLayout = "../views/layouts/main.ejs";
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const { dalle } = require("../openai");

router.get(["/", "/home"], asyncHandler(async (req, res) => {
    const locals = { title: "Home" };
    const data = await Post.find({}).sort({ createdAt: -1 }); // 최신순 정렬
    res.render("index", { locals, data, layout: mainLayout });
}));

router.get("/post/:id", asyncHandler(async (req, res) => {
    const data = await Post.findOne({ _id: req.params.id });
    res.render("post", { data, layout: mainLayout });
}));

// AI 이미지 생성 및 저장 라우트
router.get("/generate-image/:id", asyncHandler(async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시물을 찾을 수 없습니다" });
        }

        // 🔹 이미지가 이미 있으면 API 호출 없이 저장된 이미지 제공
        if (post.imageUrl) {
            return res.json({ imageUrl: post.imageUrl });
        }

        // 🔹 게시물 내용 기반으로 AI 이미지 생성
        const prompt = `Create a visually stunning and contextually accurate image based on the post: "${post.title}". 
Illustrate a scene that best represents the main idea, highlighting key themes and emotions from the text: "${post.body}". 
Incorporate essential elements that define the atmosphere and narrative of the post, ensuring an engaging and artistic depiction.
Avoid using any text, words, or letter-like symbols. Allow for abstract symbols like arrows or icons if necessary.`;

        const imageUrl = await dalle.text2im({ prompt });

        // 🔹 생성된 이미지 URL을 DB에 저장
        post.imageUrl = imageUrl;
        await post.save();

        res.json({ imageUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "이미지 생성 중 오류 발생" });
    }
}));

router.get("/about", (req, res) => {
    res.render("about", { layout: mainLayout });
});

module.exports = router;

