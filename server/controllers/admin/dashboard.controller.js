
import { getAdminDashboardData } from "../../services/admin/dashboard.service.js";

export async function getAdminDashboard(req, res) {
  try {
    const period = req.query.period ?? "30days";

    const allowedPeriods = ["7days", "30days", "12months"];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period. Use 7days, 30days, or 12months.",
      });
    }

    const data = await getAdminDashboardData(period);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
    });
  }
}
