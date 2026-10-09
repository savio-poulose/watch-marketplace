

export const addItemToCart = async (req,res) =>{
    try{

    }catch(err){
        res.status(400).json({
            message:err.message
        })
    }
}