import { usersGetAll,BlockUserToggle } from "../../services/admin/users.service.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await usersGetAll();

    res.status(200).json({
      users: users,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await BlockUserToggle(id)

    res.status(200).json({
      message: user.isBlocked
        ? "User blocked successfully"
        : "User activated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};
