require("dotenv").config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const connectDb = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

// DB 연결
connectDb();

// 레이아웃과 뷰 엔진 설정
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", "./views");

// 정적 파일
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());

// 로그인 여부 확인 미들웨어.
const checkLoginStatus = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            res.locals.isAuthenticated = true;
            res.locals.userId = decoded.id;
        } catch (err) {
            res.locals.isAuthenticated = false;
        }
    } else {
        res.locals.isAuthenticated = false;
    }
    next();
};

// 로그인 상태 확인 미들웨어 적용
app.use(checkLoginStatus);

app.use("/", require("./routes/main"));
app.use("/", require("./routes/admin"));

app.listen(port, "0.0.0.0", () => {
    console.log(`APP listening on port ${port}`);
});