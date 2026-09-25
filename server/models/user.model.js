import mongoose from "mongoose";

const userSchema = mongoose.Schema({
     userName: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email :{
        type:String,
        required:[true,"email is required"],
        unique:true,
        lowercase:true
    },
    role:{
        type:String,
        required:[true,"role is required"],
        default:"user"
    },
    password:{
        type:String,
        
    },
    profileImage:{
        type:String,
        default:"https://media.istockphoto.com/id/2171382633/vector/user-profile-icon-anonymous-person-symbol-blank-avatar-graphic-vector-illustration.jpg?s=612x612&w=0&k=20&c=ZwOF6NfOR0zhYC44xOX06ryIPAUhDvAajrPsaZ6v1-w="
    },
    isBlocked:{
        type:Boolean,
        default:false

    }
},{
    timestamps: true
})

const User = mongoose.model("User",userSchema);
export default User;