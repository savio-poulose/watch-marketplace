 
import mongoose from "mongoose";
import Address from "../../models/address.module.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

export const getAddresses = async (userId) => {
  return Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
};

export const getAddressById = async (userId, addressId) => {
  if (!isValidId(addressId)) {
    throw new Error("INVALID_ADDRESS_ID");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) throw new Error("ADDRESS_NOT_FOUND");

  return address;
};

export const createAddress = async (userId, data) => {
  const existingCount = await Address.countDocuments({ userId });

  const shouldBeDefault =
    data.isDefault === true || existingCount === 0;

  if (shouldBeDefault) {
    await Address.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  return Address.create({
    ...data,
    userId,
    isDefault: shouldBeDefault,
  });
};

export const updateAddress = async (userId, addressId, data) => {
  if (!isValidId(addressId)) {
    throw new Error("INVALID_ADDRESS_ID");
  }

  const current = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!current) throw new Error("ADDRESS_NOT_FOUND");

  if (data.isDefault === true) {
    await Address.updateMany(
      { userId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const allowedFields = [
    "fullName",
    "phone",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "pincode",
    "addressType",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      current[field] = data[field];
    }
  }

  if (data.isDefault === true) {
    current.isDefault = true;
  } else if (data.isDefault === false && current.isDefault) {
    // Keep at least one default when possible.
    const anotherAddress = await Address.findOne({
      userId,
      _id: { $ne: current._id },
    });

    if (anotherAddress) {
      current.isDefault = false;
      await Address.updateOne(
        { _id: anotherAddress._id, userId },
        { $set: { isDefault: true } }
      );
    }
  }

  await current.save();
  return current;
};

export const setDefaultAddress = async (userId, addressId) => {
  if (!isValidId(addressId)) {
    throw new Error("INVALID_ADDRESS_ID");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) throw new Error("ADDRESS_NOT_FOUND");

  await Address.updateMany(
    { userId },
    { $set: { isDefault: false } }
  );

  address.isDefault = true;
  await address.save();

  return address;
};

export const deleteAddress = async (userId, addressId) => {
  if (!isValidId(addressId)) {
    throw new Error("INVALID_ADDRESS_ID");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) throw new Error("ADDRESS_NOT_FOUND");

  await address.deleteOne();

  if (address.isDefault) {
    const replacement = await Address.findOne({ userId }).sort({
      createdAt: -1,
    });

    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return { message: "Address deleted successfully." };
};
