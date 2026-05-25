import { connectDB } from "./configs/database.config";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import adminRoutes from "./routes/admin/index.route";
import clientRoutes from "./routes/client/index.route";
import { domainCDN, pathAdmin } from "./configs/variable.config";
import cookieParser from "cookie-parser";
import session = require("express-session");
import { configureGooglePassport } from "./configs/googleOauth.config";
import passport = require("passport");
import { configureFacebookPassport } from "./configs/facebookOauth.config";

// Load biến môi trường
dotenv.config();

const app = express();
const port = 4000;

// Kết nối cơ sở dữ liệu
connectDB();

// Cho phép gửi dữ liệu lên dạng json
app.use(express.json());

// Thư viện cho phép lấy cookie
app.use(cookieParser());

// Cấu hình session
app.use(
  session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

configureGooglePassport(passport);
configureFacebookPassport(passport);

// Thiết lập thư mục views và view engine Pug
app.set("views", path.join(__dirname, "views")); // Thư mục chứa file Pug
app.set("view engine", "pug"); // Thiết lập Pug làm view engine

// Thiết lập thư mục chứa file tĩnh
app.use(express.static(path.join(__dirname, "public")));

// Tạo biến toàn cục trong file Pug
app.locals.pathAdmin = pathAdmin;
app.locals.domainCDN = domainCDN;

app.use(`/${pathAdmin}`, adminRoutes);
app.use("/", clientRoutes);

app.listen(port, () => {
  console.log(`Website đang chạy trên cổng ${port}`);
});
