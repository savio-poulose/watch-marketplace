import mongoose from "mongoose";


const dbConnect = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URL,{dbName:"watch-marketplace"})
        console.log("database connected")
    }catch(error){
        console.log(error)
    }
}

export default dbConnect