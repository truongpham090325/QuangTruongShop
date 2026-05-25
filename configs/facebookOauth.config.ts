import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import AccountUser from "../models/account-user.model";
import slugify from "slugify";

// Hàm nhận passport để cấu hình
export const configureFacebookPassport = (
  passportInstance: typeof passport,
) => {
  // Thiết lập chiến lược đăng nhập bằng Facebook
  passportInstance.use(
    new FacebookStrategy(
      {
        clientID: `${process.env.FACEBOOK_APP_ID}`, // ID ứng dụng Dacebook
        clientSecret: `${process.env.FACEBOOK_APP_SECRET}`, // Secret key
        callbackURL: `${process.env.FACEBOOK_CALLBACK_URL}`, // URL gọi vào sau khi đăng nhập
        profileFields: ["id", "displayName", "photos", "email"], // Lấy thêm các trường dữ liệu
      },
      // Hàm callback khi Facebook xác thực thành công
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Lấy email an toàn (tránh lỗi undefined khi Facebook không trả về email)
          const email =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : "";

          // 1. Tìm user theo facebookId trước
          let existingUser = await AccountUser.findOne({
            facebookId: profile.id,
          });
          if (existingUser) {
            return done(null, existingUser);
          }

          // 2. Nếu chưa có facebookId, tìm theo email (nếu có)
          if (email) {
            existingUser = await AccountUser.findOne({ email: email });
            if (existingUser) {
              // Cập nhật thêm facebookId vào user đã có email này
              existingUser.facebookId = profile.id;
              await existingUser.save();
              return done(null, existingUser);
            }
          }

          // 3. Nếu chưa có thì tạo user mới
          const fullName = profile.displayName || "Người dùng Facebook";
          const search = slugify(`${fullName} ${email}`, {
            replacement: " ",
            lower: true, // Chữ thường
          });

          const newUser = new AccountUser({
            facebookId: profile.id,
            fullName: fullName,
            email: email,
            search: search,
          });
          await newUser.save();

          // Trả user mới tạo cho Passport
          done(null, newUser);
        } catch (error) {
          // Nếu lỗi, báo cho Passport
          done(error, undefined);
        }
      },
    ),
  );

  // Lưu user.id vào session
  passportInstance.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Khi có session, lấy lại user từ database
  passportInstance.deserializeUser(async (id: string, done) => {
    try {
      const user = await AccountUser.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
