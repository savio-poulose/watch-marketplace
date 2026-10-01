import User from "../../models/user.model.js"


export const usersGetAll = async(req,res)=>{
    const users = await User.find({}).select("-password") 
    return users
}

export const BlockUserToggle = async(id)=>{
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isBlocked = !user.isBlocked;

    await user.save();
    return user
}