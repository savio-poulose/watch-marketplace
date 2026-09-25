import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (userName, email, password) => {
  const saltRounds = 10;

  const user = await User.findOne({ email: email });
  console.log(user);
  if (user) {
    throw new Error("user already exist ");
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const newUser = await User.create({
    userName: userName,
    email: email,
    password: hashedPassword,
  });

  return newUser;
};

export const LoginUser = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null;
  }

  const payload = { id: user._id, email: user.email };

  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1hr" });

  return token;

  // console.log(user.password)
};

export const googleLoginUser = async (credential) => {

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const email = payload.email;
  const userName = payload.name;
  const googleId = payload.sub;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      userName,
      email,
      googleId,
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "1hr",
    }
  );

  return token;
};


export const profileGet = async (id)=>{
  const user = await User.findOne({_id:id})
  return user
}