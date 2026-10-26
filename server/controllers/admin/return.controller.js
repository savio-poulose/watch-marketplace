import {
  getAllReturnRequestsService,
  getReturnRequestByIdService,
  reviewReturnRequestService,
  updateReturnProcessingStatusService,
} from "../../services/admin/return.service.js";

export const getAllReturnRequests = async (req, res, next) => {
  try {
    const result = await getAllReturnRequestsService({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnRequestById = async (req, res, next) => {
  try {
    const returnRequest = await getReturnRequestByIdService(
      req.params.returnId
    );

    res.status(200).json({
      success: true,
      returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewReturnRequest = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    const returnRequest = await reviewReturnRequestService({
      returnId: req.params.returnId,
      status,
      rejectionReason,
    });

    res.status(200).json({
      success: true,
      message: `Return request ${status.toLowerCase()} successfully.`,
      returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReturnProcessingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const returnRequest = await updateReturnProcessingStatusService({
      returnId: req.params.returnId,
      status,
    });

    res.status(200).json({
      success: true,
      message: "Return processing status updated successfully.",
      returnRequest,
    });
  } catch (error) {
    next(error);
  }
};