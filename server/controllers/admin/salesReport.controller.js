
import { getSalesReport } from "../../services/admin/salesReport.service.js";

export const salesReportController = async (req, res) => {
  try {
    const report = await getSalesReport({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    return res.status(200).json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error("Sales report error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to generate sales report",
    });
  }
};
