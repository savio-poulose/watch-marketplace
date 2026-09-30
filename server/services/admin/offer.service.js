import Offer from "../../models/offer.model.js";

export const offerAdd = async (data) => {
  const offer = await Offer.create(data);

  return offer;
};

export const offerGetByProductId = async (productId) => {
  const offer = await Offer.findOne({ productId });

  return offer;
};

export const offerUpdate = async (productId, data) => {
  const offer = await Offer.findOneAndUpdate(
    { productId },
    data,
    {
      new: true,
      runValidators: true,
    }
  );

  return offer;
};

export const offerDelete = async (productId) => {
  const offer = await Offer.findOneAndDelete({ productId });

  return offer;
};