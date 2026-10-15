import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay API keys are missing from environment variables.");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});


export {keyId} 
export default razorpay;