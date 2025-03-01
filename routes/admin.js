const express = require("express");
const router = express.Router();
const adminLayout = "../views/layouts/admin";
const adminLayout2 = "../views/layouts/admin-nologout";
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// 로그인 상태 확인 미들웨어
const checkLogin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/admin");
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.id;
        res.locals.isAuthenticated = true; // 로그인 상태 유지
        next();
    } catch (error) {
        res.clearCookie("token");
        return res.redirect("/admin");
    }
};

// 로그인 페이지 렌더링
router.get("/admin", (req, res) => {
    const locals = { title: "관리자 페이지" };

    if (res.locals.isAuthenticated) {
        return res.redirect("/allPosts"); // 로그인 상태면 바로 이동
    }
    res.render("admin/index", { locals, layout: adminLayout2 });
});

router.post(
    "/admin",
    asyncHandler(async(req, res) => {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "일치하는 사용자가 없습니다." });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "1d" });

        // 🔹 사용자 정보를 세션에 저장
        req.session.user = { id: user._id, username: user.username };

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.redirect("/");
    })
);

// 🔹 회원가입 페이지 렌더링
router.get("/register", (req, res) => {
    res.render("admin/register", { title: "회원가입", layout: adminLayout2 });
});

// 🔹 회원가입 처리
router.post(
    "/register",
    asyncHandler(async(req, res) => {
        const { username, password } = req.body;

        // 이미 존재하는 사용자 확인
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
        }

        // 비밀번호 암호화
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 새 사용자 생성
        const newUser = new User({
            username: username,
            password: hashedPassword,
        });

        await newUser.save();
        res.redirect("/admin"); // 회원가입 후 로그인 페이지로 이동
    })
);

// 게시물 목록 페이지 (로그인 필요)
router.get(
    "/allPosts",
    checkLogin,
    asyncHandler(async(req, res) => {
        const locals = {
            title: "Posts",
        };
        const data = await Post.find().sort({ updateAt: "desc", createdAt: "desc" }); // 전체 게시물 가져오기
        res.render("admin/allPosts", { // locals값과 data 넘기기
            locals,
            data,
            layout: adminLayout,
        });
    })
);



// 로그아웃
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("세션 삭제 오류:", err);
            return res.status(500).json({ message: "로그아웃 중 오류 발생" });
        }
        res.clearCookie("token"); // 유지 (사용자 인증 쿠키 삭제)
        res.redirect("/");
    });
});


// 게시물 작성
router.get(
    "/add",
    checkLogin,
    asyncHandler(async(req, res) => {
        const locals = {
            title: "게시물 작성",
        };
        res.render("admin/add", {
            locals,
            layout: adminLayout,
        });
    })
);

// 게시물 추가
router.post(
    "/add",
    checkLogin,
    asyncHandler(async(req, res) => {
        const { title, body, style } = req.body;

        const newPost = new Post({
            title: title,
            body: body,
            style: style,
            createdAt: Date.now(),
        });

        await Post.create(newPost);
        res.redirect(`/post/${newPost._id}`);
    })
);

// 게시물 수정
router.get(
    "/edit/:id",
    checkLogin,
    asyncHandler(async(req, res) => {
        const locals = {
            title: "게시물 편집",
        };
        //id 값을 사용해서 게시물 가져오기
        const data = await Post.findOne({ _id: req.params.id });
        res.render("admin/edit", {
            locals,
            data,
            layout: adminLayout,
        });
    })
);

// 게시물 게시물 수정 처리
router.put(
    "/edit/:id",
    checkLogin,
    asyncHandler(async(req, res) => {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            createdAt: Date.now(),
        });
        // 수정한 후 전체 목록 다시 표시하기
        res.redirect("/allPosts");
    })
);

// 게시물 삭제
router.delete(
    "/delete/:id",
    checkLogin,
    asyncHandler(async(req, res) => {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect("/allPosts");
    })
);

module.exports = router;