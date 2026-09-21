import Category from "../../models/category.model.js";

export const categoryAdd = async (data) =>{
    const category = Category.create(data)

    return category
}