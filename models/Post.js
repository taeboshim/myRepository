const mongoose = require("mongoose");

// 스키마 정의
const PostSchema=new mongoose.Schema({
    // 게시물 제목
    title:{
        type: String,
        required:true, 
    },
    body:{
        type: String,
        required:true,
    },
    createdAt:{
        type: Date,
        default:Date.now(),
    },
    image:{
        type:Buffer,
    },
    contentType:{
        type:String,
    },
});

module.exports = mongoose.model("Post", PostSchema);
