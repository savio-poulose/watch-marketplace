import Offer from "../../models/offer.model.js";

export const offerAdd = async (data) => {
  const offerData = {
    ...data,
    offerType: data.offerType || "product",
  };
  const offer = await Offer.create(offerData);

  return offer;
};

export const offerGetByProductId = async (id) => {
  const offer = await Offer.findOne({
    productId: id,
    $or: [{ offerType: "product" }, { offerType: { $exists: false } }],
  });

  return offer;
};

export const offerUpdate = async (productId, data) => {
  const updateData = {
    ...data,
    offerType: data.offerType || "product",
    productId,
  };
  const offer = await Offer.findOneAndUpdate(
    {
      productId,
      $or: [{ offerType: "product" }, { offerType: { $exists: false } }],
    },
    updateData,
    { returnDocument: "after" }
  );

  return offer;
};

export const offerDelete = async (productId) => {
  const offer = await Offer.findOneAndDelete({
    productId,
    $or: [{ offerType: "product" }, { offerType: { $exists: false } }],
  });

  return offer;
};
