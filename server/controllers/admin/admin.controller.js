import { loginAdmin } from "../../services/admin/admin.service.js";

export const adminLogin = async (req, res) => {
  try {

    console.log("req.body :  "+req.body)
    const { email, password } = req.body;
    

    const token = await loginAdmin(email, password);

    if (!token) {
      return res.status(401).json({
        message: "invalid email or password",
      });
    }

    res.cookie("adminAccessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
       success:true, 
      message: "login succesfull"
    });
    // console.log("login succesfull");
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success:false,
      message:"something went wrong"
    });
  }
};




export const getCurrentAdmin = async (req, res) => {
  try {
    console.log("CURRENT ADMIN:", req.user);

    return res.status(200).json({
      success: true,
      admin: req.user,
    });

  } catch (error) {
    console.log("GET ADMIN ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};