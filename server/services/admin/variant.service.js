import Variant from "../../models/variant.model.js";

export const variantAdd = async (data)=>{
    const variant  = await Variant.create(data)
    // console.log(data)
    return variant

}

export const variantGetAll = async () =>{
    const variants = await Variant.find()
    return variants
}