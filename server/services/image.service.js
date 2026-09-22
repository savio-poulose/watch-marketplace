import cloudinary from "../config/cloudinary.js";

export const uploadImages = async (files) => {
  const imageUrls = [];

  for (const file of files) {
    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    );

    imageUrls.push(result.secure_url);
  }

  console.log(imageUrls)
  return imageUrls;
};