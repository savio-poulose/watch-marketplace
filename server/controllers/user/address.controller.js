
import * as addressService from "../../services/user/address.service.js";

const getUserId = (req) => req.user?._id || req.user?.id;

const handleError = (res, error) => {
  if (error.message === "INVALID_ADDRESS_ID") {
    return res.status(400).json({ message: "Invalid address ID." });
  }

  if (error.message === "ADDRESS_NOT_FOUND") {
    return res.status(404).json({ message: "Address not found." });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  console.error("Address error:", error);
  return res.status(500).json({
    message: "Something went wrong with the address request.",
  });
};

const validateAddress = (data) => {
  if (
    !data.fullName?.trim() ||
    !/^[6-9]\d{9}$/.test(data.phone || "") ||
    !data.addressLine1?.trim() ||
    !data.city?.trim() ||
    !data.state?.trim() ||
    !/^\d{6}$/.test(data.pincode || "")
  ) {
    return "Please provide valid address details.";
  }

  if (
    data.addressType !== undefined &&
    !["Home", "Work"].includes(data.addressType)
  ) {
    return "Address type must be Home or Work.";
  }

  return null;
};

export const addAddress = async (req, res) => {
  try {
    const validationError = validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const address = await addressService.createAddress(
      getUserId(req),
      req.body
    );

    return res.status(201).json({
      message: "Address added successfully.",
      address,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await addressService.getAddresses(getUserId(req));

    return res.status(200).json({ addresses });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getOneAddress = async (req, res) => {
  try {
    const address = await addressService.getAddressById(
      getUserId(req),
      req.params.addressId
    );

    return res.status(200).json({ address });
  } catch (error) {
    return handleError(res, error);
  }
};

export const editAddress = async (req, res) => {
  try {
    const validationError = validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const address = await addressService.updateAddress(
      getUserId(req),
      req.params.addressId,
      req.body
    );

    return res.status(200).json({
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const makeDefaultAddress = async (req, res) => {
  try {
    const address = await addressService.setDefaultAddress(
      getUserId(req),
      req.params.addressId
    );

    return res.status(200).json({
      message: "Default address updated.",
      address,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const removeAddress = async (req, res) => {
  try {
    const result = await addressService.deleteAddress(
      getUserId(req),
      req.params.addressId
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
