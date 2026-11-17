import {
  getSalesReport,
  generateSalesReportPDF,
} from "../../services/admin/salesReport.service.js";

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

export const salesReportPdfController = async (req, res) => {
  try {
    const { buffer, filename } = await generateSalesReportPDF({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", buffer.length);

    return res.status(200).end(buffer);
  } catch (error) {
    console.error("Sales report PDF error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to generate sales report PDF",
    });
  }
};
