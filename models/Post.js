const mongoose=require("mongoose");

// 스키마 정의
const PostSchema=new mongoose.Schema({
    // 게시물 제목
    title:{
        type: String,
        required:true, //커밋테스트용 //커밋테스트2
    },
    body:{
        type: String,
        required:true,
    },
    createdAt:{
        type: Date,
        default:Date.now(),
    },
    imageUrl:{
        type:String,
    }
});

module.exports=mongoose.model("Post", PostSchema);