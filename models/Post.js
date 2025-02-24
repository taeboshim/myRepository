const mongoose = require("mongoose");

// 스키마 정의
const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now() },
    style: { type: String, default: "anime" },
    image: { type: Buffer }  // 🔹 AI 이미지 파일을 직접 저장 (Binary)
});

module.exports = mongoose.model("Post", PostSchema);
