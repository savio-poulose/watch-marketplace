import { useEffect, useState, useCallback } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import api from "../../api/axios.js";

import Navbar from "../../components/layout/Navbar.jsx";



const formatPrice = (amount) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 2,

  }).format(Number(amount) || 0);



const formatDate = (date) => {

  if (!date) return "Unavailable";



  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Unavailable";



  return parsed.toLocaleString("en-IN", {

    day: "numeric",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

};



const STATUS_STYLES = {

  PLACED: "bg-amber-50 text-amber-700 border-amber-200",

  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",

  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",

  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",

  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",

  CANCELLED: "bg-red-50 text-red-700 border-red-200",

  RETURNED: "bg-gray-100 text-gray-700 border-gray-200",

};



const RETURN_STATUS_LABELS = {

  REQUESTED: "Waiting for Admin",

  APPROVED: "Return Approved",

  REJECTED: "Return Rejected",

  ITEM_RECEIVED: "Item Received",

  REFUND_PENDING: "Refund Processing",

  REFUNDED: "Refund Completed",

};



const RETURN_STATUS_STYLES = {

  REQUESTED: "border-amber-200 bg-amber-50 text-amber-800",

  APPROVED: "border-blue-200 bg-blue-50 text-blue-800",

  REJECTED: "border-red-200 bg-red-50 text-red-800",

  ITEM_RECEIVED: "border-indigo-200 bg-indigo-50 text-indigo-800",

  REFUND_PENDING: "border-purple-200 bg-purple-50 text-purple-800",

  REFUNDED: "border-emerald-200 bg-emerald-50 text-emerald-800",

};



const ACTIVE_RETURN_STATUSES = [

  "REQUESTED",

  "APPROVED",

  "ITEM_RECEIVED",

  "REFUND_PENDING",

  "REFUNDED",

];



const formatStatus = (status) => {

  const value = String(status || "PLACED").toUpperCase();

  return value.charAt(0) + value.slice(1).toLowerCase();

};



const getProductId = (item) =>

  item.productId?._id ||

  item.productId ||

  item.product?._id ||

  item.variantId?.productId?._id ||

  item.variantId?.productId ||

  item.variant?.productId?._id ||

  item.variant?.productId ||

  null;



const getVariantId = (item) =>

  item.variantId?._id ||

  item.variantId ||

  item.variant?._id ||

  item.variant ||

  null;



const OrderDetails = () => {

  const { orderId } = useParams();

  const navigate = useNavigate();



  const [order, setOrder] = useState(null);

  const [returnRequests, setReturnRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  const [activeForm, setActiveForm] = useState(null);

  const [returnReason, setReturnReason] = useState("");

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewComment, setReviewComment] = useState("");



  const [submitting, setSubmitting] = useState(false);

  const [actionError, setActionError] = useState("");

  const [actionSuccess, setActionSuccess] = useState("");



  const fetchOrder = useCallback(async () => {

    const response = await api.get(`/user/order/${orderId}`);

    const fetchedOrder = response.data?.order || null;



    setOrder(fetchedOrder);



    if (!fetchedOrder) {

      throw new Error("Order details could not be found.");

    }



    // Return requests are loaded separately from the order.

    // A failure here should not hide otherwise valid order details.

    try {

      const returnsResponse = await api.get(

        `/user/order/${orderId}/returns`

      );



      setReturnRequests(returnsResponse.data?.returns || []);

    } catch (returnError) {

      console.error(

        "Unable to load return requests:",

        returnError.response?.data || returnError.message

      );

      throw returnError;

    }



    return fetchedOrder;

  }, [orderId]);



  useEffect(() => {

    let ignore = false;



    const loadOrder = async () => {

      try {

        setLoading(true);

        setError("");



        const response = await api.get(`/user/order/${orderId}`);

        const fetchedOrder = response.data?.order || null;



        if (ignore) return;



        if (!fetchedOrder) {

          setError("Order details could not be found.");

          return;

        }



        setOrder(fetchedOrder);



        try {

          const returnsResponse = await api.get(

            `/user/order/${orderId}/returns`

          );



          if (!ignore) {

            setReturnRequests(returnsResponse.data?.returns || []);

          }

        } catch (returnError) {

          console.error(

            "Unable to load return requests:",

            returnError.response?.data || returnError.message

          );



          if (!ignore) {

            setError(

              returnError.response?.data?.message ||

                "Order loaded, but return statuses could not be loaded. Check the return API."

            );

          }

        }

      } catch (err) {

        if (!ignore) {

          setError(

            err.response?.data?.message ||

              err.message ||

              "Unable to load order details. Please try again."

          );

        }

      } finally {

        if (!ignore) setLoading(false);

      }

    };



    loadOrder();



    return () => {

      ignore = true;

    };

  }, [orderId]);



  const openReturnForm = (item, index) => {

    setActiveForm({ type: "return", item, index });

    setReturnReason("");

    setActionError("");

    setActionSuccess("");

  };



  const openReviewForm = (item, index) => {

    setActiveForm({ type: "review", item, index });

    setReviewRating(5);

    setReviewComment("");

    setActionError("");

    setActionSuccess("");

  };



  const closeForm = () => {

    if (submitting) return;



    setActiveForm(null);

    setActionError("");

    setActionSuccess("");

  };



  const getReturnRequestForItem = (item) => {

    const productId = getProductId(item);

    const variantId = getVariantId(item);



    if (!productId || !variantId) return null;



    const matchingRequests = returnRequests.filter(

      (request) =>

        String(request.productId?._id || request.productId) ===

          String(productId) &&

        String(request.variantId?._id || request.variantId) ===

          String(variantId)

    );



    // Prefer a request that is still active or already completed.

    // A rejected request alone does not prevent another attempt.

    return (

      matchingRequests.find((request) =>

        ACTIVE_RETURN_STATUSES.includes(

          String(request.status).toUpperCase()

        )

      ) ||

      matchingRequests[0] ||

      null

    );

  };



  const handleReturnSubmit = async (event) => {

    event.preventDefault();



    if (!activeForm?.item || !order) return;



    if (!returnReason.trim()) {

      setActionError("Please provide a reason for the return.");

      return;

    }



    const item = activeForm.item;

    const productId = getProductId(item);

    const variantId = getVariantId(item);



    if (!productId || !variantId) {

      setActionError(

        "Product or variant ID is missing from this order item."

      );

      return;

    }



    const existingReturn = getReturnRequestForItem(item);



    if (

      existingReturn &&

      ACTIVE_RETURN_STATUSES.includes(

        String(existingReturn.status).toUpperCase()

      )

    ) {

      setActionError("A return request already exists for this product.");

      return;

    }



    try {

      setSubmitting(true);

      setActionError("");

      setActionSuccess("");



      await api.post(`/user/order/${order._id}/return`, {

        productId,

        variantId,

        quantity: Number(item.quantity) || 1,

        reason: returnReason.trim(),

      });



      // Refresh from MongoDB so the status survives a page reload.

      const returnsResponse = await api.get(

        `/user/order/${order._id}/returns`

      );



      setReturnRequests(returnsResponse.data?.returns || []);

      setActiveForm(null);

      setReturnReason("");

      setActionSuccess(

        "Your return request has been submitted. It is waiting for admin review."

      );

    } catch (err) {

      setActionError(

        err.response?.data?.message ||

          "Unable to submit the return request. Please try again."

      );

    } finally {

      setSubmitting(false);

    }

  };



  const handleReviewSubmit = async (event) => {

    event.preventDefault();



    if (!activeForm?.item || !order) return;



    if (!reviewComment.trim()) {

      setActionError("Please write a comment for your review.");

      return;

    }



    const item = activeForm.item;

    const productId = getProductId(item);



    if (!productId) {

      setActionError("The product ID is missing from this order item.");

      return;

    }



    try {

      setSubmitting(true);

      setActionError("");

      setActionSuccess("");



      await api.post("/user/reviews", {

        orderId: order._id,

        productId,

        rating: Number(reviewRating),

        comment: reviewComment.trim(),

      });



      setActiveForm(null);

      setReviewComment("");

      setActionSuccess("Your review has been submitted.");

    } catch (err) {

      setActionError(

        err.response?.data?.message ||

          "Unable to submit your review. Please try again."

      );

    } finally {

      setSubmitting(false);

    }

  };



  if (loading) {

    return (

      <div className="min-h-screen bg-[#F8F8F6] text-[#111827]">

        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">

          <div className="animate-pulse space-y-5">

            <div className="h-8 w-56 rounded bg-gray-200" />

            <div className="h-36 rounded border bg-white" />

            <div className="h-64 rounded border bg-white" />

          </div>

        </main>

      </div>

    );

  }



  if (error || !order) {

    return (

      <div className="min-h-screen bg-[#F8F8F6] text-[#111827]">

        <Navbar />

        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">

          <div className="border border-gray-200 bg-white px-6 py-12 text-center">

            <h1 className="text-2xl font-semibold">

              Unable to load order

            </h1>

            <p className="mt-3 text-sm text-gray-500">{error}</p>

            <Link

              to="/user/orders"

              className="mt-6 inline-flex bg-[#111827] px-6 py-3 text-sm font-medium text-white hover:bg-[#9A7B3F]"

            >

              Back to My Orders

            </Link>

          </div>

        </main>

      </div>

    );

  }



  const items = Array.isArray(order.items) ? order.items : [];

  const address = order.shippingAddress || {};

  const status = String(order.orderStatus || "PLACED").toUpperCase();

  const statusStyle =

    STATUS_STYLES[status] || "border-gray-200 bg-gray-50 text-gray-700";

  const isDelivered = status === "DELIVERED";



  return (

    <div className="min-h-screen bg-[#F8F8F6] text-[#111827]">

      <Navbar />



      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#9A7B3F]">

              HORAE · Your collection

            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">

              Order Details

            </h1>

            <p className="mt-3 text-sm text-gray-500">

              Order #{order.orderNumber || order._id}

            </p>

            <p className="mt-1 text-sm text-gray-500">

              Placed on {formatDate(order.createdAt)}

            </p>

          </div>



          <span

            className={`inline-flex w-fit items-center gap-2 border px-4 py-2 text-sm font-medium ${statusStyle}`}

          >

            <span className="h-2 w-2 rounded-full bg-current" />

            {formatStatus(status)}

          </span>

        </div>



        {actionSuccess && (

          <div

            role="status"

            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"

          >

            {actionSuccess}

          </div>

        )}



        <section className="mt-8 border border-gray-200 bg-white">

          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">

            <h2 className="text-lg font-semibold">Items Ordered</h2>

            <p className="mt-1 text-sm text-gray-500">

              {items.length} {items.length === 1 ? "item" : "items"} in this

              order

            </p>

          </div>



          {items.length === 0 ? (

            <p className="p-6 text-sm text-gray-500">

              No item details are available for this order.

            </p>

          ) : (

            <div className="divide-y divide-gray-100">

              {items.map((item, index) => {

                const existingReturn = getReturnRequestForItem(item);

                const returnStatus = String(

                  existingReturn?.status || ""

                ).toUpperCase();



                const hasActiveReturn =

                  existingReturn &&

                  ACTIVE_RETURN_STATUSES.includes(returnStatus);



                return (

                  <div

                    key={

                      item._id ||

                      getVariantId(item) ||

                      index

                    }

                    className="flex flex-col gap-4 p-5 sm:p-7"

                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                      <div className="flex h-28 w-28 shrink-0 items-center justify-center bg-[#F8F8F6]">

                        {item.image ? (

                          <img

                            src={item.image}

                            alt={item.productName || "Ordered watch"}

                            className="h-full w-full object-contain p-2"

                          />

                        ) : (

                          <span className="text-xs text-gray-400">

                            No image

                          </span>

                        )}

                      </div>



                      <div className="min-w-0 flex-1">

                        <p className="text-xs uppercase tracking-[0.18em] text-[#9A7B3F]">

                          HORAE Timepiece

                        </p>

                        <h3 className="mt-2 text-base font-medium sm:text-lg">

                          {item.productName || "Watch"}

                        </h3>



                        {item.variantSku && (

                          <p className="mt-1 break-all text-xs text-gray-400">

                            SKU: {item.variantSku}

                          </p>

                        )}



                        <p className="mt-2 text-sm text-gray-500">

                          Quantity: {item.quantity}

                        </p>

                        <p className="mt-1 text-sm text-gray-500">

                          Unit price: {formatPrice(item.unitPrice)}

                        </p>

                      </div>



                      <div className="border-t border-gray-100 pt-3 sm:min-w-32 sm:border-0 sm:pt-0 sm:text-right">

                        <p className="text-xs text-gray-500">Item total</p>

                        <p className="mt-1 text-lg font-semibold">

                          {formatPrice(

                            item.subtotal ??

                              Number(item.unitPrice || 0) *

                                Number(item.quantity || 0)

                          )}

                        </p>



                        {Number(item.offerDiscount) > 0 && (

                          <p className="mt-1 text-xs text-emerald-700">

                            Saved {formatPrice(item.offerDiscount)}

                          </p>

                        )}

                      </div>

                    </div>



                    {isDelivered && (

                      <div className="flex flex-wrap items-start gap-3 border-t border-gray-100 pt-4">

                        {existingReturn && (
                          <div
                            className={`min-w-56 border px-4 py-3 text-sm ${
                              RETURN_STATUS_STYLES[returnStatus] ||
                              "border-gray-200 bg-gray-50 text-gray-700"
                            }`}
                          >
                            <p className="font-medium">
                              {RETURN_STATUS_LABELS[returnStatus] ||
                                "Return request submitted"}
                            </p>
                            <p className="mt-1 text-xs">
                              Submitted on{" "}
                              {formatDate(
                                existingReturn.requestedAt ||
                                  existingReturn.createdAt
                              )}
                            </p>
                            {returnStatus === "REJECTED" &&
                              existingReturn.rejectionReason && (
                                <p className="mt-2 text-xs leading-5">
                                  <span className="font-semibold">Reason: </span>
                                  {existingReturn.rejectionReason}
                                </p>
                              )}
                          </div>
                        )}

                        {(!existingReturn || returnStatus === "REJECTED") && (
                          <button
                            type="button"
                            onClick={() => openReturnForm(item, index)}
                            className="border border-[#111827] px-4 py-2.5 text-sm font-medium transition hover:bg-gray-100"
                          >
                            {returnStatus === "REJECTED"
                              ? "Request Return Again"
                              : "Return Product"}
                          </button>
                        )}



                        <button

                          type="button"

                          onClick={() => openReviewForm(item, index)}

                          className="bg-[#9A7B3F] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#806532]"

                        >

                          Write a Review

                        </button>

                      </div>

                    )}



                    {activeForm?.index === index &&

                      activeForm.type === "return" && (

                        <div className="border border-gray-200 bg-[#FAFAF8] p-5 sm:p-6">

                          <form onSubmit={handleReturnSubmit}>

                            <h3 className="text-lg font-semibold">

                              Request a Return

                            </h3>

                            <p className="mt-1 text-sm text-gray-500">

                              Product: {item.productName || "Watch"}

                            </p>



                            <label

                              htmlFor={`returnReason-${index}`}

                              className="mt-5 block text-sm font-medium"

                            >

                              Reason for return

                            </label>

                            <textarea

                              id={`returnReason-${index}`}

                              value={returnReason}

                              onChange={(event) =>

                                setReturnReason(event.target.value)

                              }

                              rows={4}

                              maxLength={1000}

                              required

                              placeholder="Explain why you want to return this product..."

                              className="mt-2 w-full border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"

                            />



                            {actionError && (

                              <p className="mt-3 text-sm text-red-600">

                                {actionError}

                              </p>

                            )}



                            <div className="mt-4 flex flex-wrap gap-3">

                              <button

                                type="submit"

                                disabled={submitting}

                                className="bg-[#111827] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#9A7B3F] disabled:opacity-50"

                              >

                                {submitting

                                  ? "Submitting..."

                                  : "Submit Return Request"}

                              </button>

                              <button

                                type="button"

                                onClick={closeForm}

                                disabled={submitting}

                                className="border border-gray-300 px-5 py-2.5 text-sm font-medium disabled:opacity-50"

                              >

                                Cancel

                              </button>

                            </div>

                          </form>

                        </div>

                      )}



                    {activeForm?.index === index &&

                      activeForm.type === "review" && (

                        <div className="border border-gray-200 bg-[#FAFAF8] p-5 sm:p-6">

                          <form onSubmit={handleReviewSubmit}>

                            <h3 className="text-lg font-semibold">

                              Review this Product

                            </h3>

                            <p className="mt-1 text-sm text-gray-500">

                              {item.productName || "Watch"}

                            </p>



                            <fieldset className="mt-5">

                              <legend className="text-sm font-medium">

                                Your rating

                              </legend>

                              <div className="mt-2 flex gap-1">

                                {[1, 2, 3, 4, 5].map((star) => (

                                  <button

                                    key={star}

                                    type="button"

                                    aria-label={`${star} star${

                                      star > 1 ? "s" : ""

                                    }`}

                                    aria-pressed={reviewRating === star}

                                    onClick={() => setReviewRating(star)}

                                    className={`text-3xl transition ${

                                      star <= reviewRating

                                        ? "text-[#9A7B3F]"

                                        : "text-gray-300"

                                    }`}

                                  >

                                    ★

                                  </button>

                                ))}

                              </div>

                              <p className="mt-1 text-xs text-gray-500">

                                {reviewRating} out of 5 stars

                              </p>

                            </fieldset>



                            <label

                              htmlFor={`reviewComment-${index}`}

                              className="mt-5 block text-sm font-medium"

                            >

                              Your review

                            </label>

                            <textarea

                              id={`reviewComment-${index}`}

                              value={reviewComment}

                              onChange={(event) =>

                                setReviewComment(event.target.value)

                              }

                              rows={4}

                              maxLength={2000}

                              required

                              placeholder="Share your experience with this watch..."

                              className="mt-2 w-full border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"

                            />



                            {actionError && (

                              <p className="mt-3 text-sm text-red-600">

                                {actionError}

                              </p>

                            )}



                            <div className="mt-4 flex flex-wrap gap-3">

                              <button

                                type="submit"

                                disabled={submitting}

                                className="bg-[#9A7B3F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#806532] disabled:opacity-50"

                              >

                                {submitting

                                  ? "Submitting..."

                                  : "Submit Review"}

                              </button>

                              <button

                                type="button"

                                onClick={closeForm}

                                disabled={submitting}

                                className="border border-gray-300 px-5 py-2.5 text-sm font-medium disabled:opacity-50"

                              >

                                Cancel

                              </button>

                            </div>

                          </form>

                        </div>

                      )}

                  </div>

                );

              })}

            </div>

          )}

        </section>



        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          <section className="border border-gray-200 bg-white p-5 sm:p-7">

            <h2 className="text-lg font-semibold">Shipping Address</h2>

            <div className="mt-5 space-y-2 text-sm leading-6 text-gray-600">

              <p className="font-medium text-[#111827]">

                {address.name || "Name unavailable"}

              </p>

              <p>{address.phone || "Phone unavailable"}</p>

              {address.addressLine && <p>{address.addressLine}</p>}

              <p>

                {[address.city, address.state].filter(Boolean).join(", ")}

              </p>

              {address.pincode && <p>PIN: {address.pincode}</p>}

              {address.landmark && <p>Landmark: {address.landmark}</p>}

            </div>

          </section>



          <section className="border border-gray-200 bg-white p-5 sm:p-7">

            <h2 className="text-lg font-semibold">Payment Information</h2>

            <div className="mt-5 space-y-4 text-sm">

              <div className="flex justify-between gap-4">

                <span className="text-gray-500">Payment method</span>

                <span className="font-medium">

                  {order.paymentMethod === "COD"

                    ? "Cash on Delivery"

                    : order.paymentMethod || "Unavailable"}

                </span>

              </div>



              <div className="flex justify-between gap-4">

                <span className="text-gray-500">Payment status</span>

                <span className="font-medium">

                  {formatStatus(order.paymentStatus || "PENDING")}

                </span>

              </div>



              <div className="border-t border-gray-100 pt-4">

                <div className="flex justify-between gap-4">

                  <span className="text-gray-500">Subtotal</span>

                  <span>{formatPrice(order.subtotal)}</span>

                </div>



                <div className="mt-3 flex justify-between gap-4">

                  <span className="text-gray-500">Offer discount</span>

                  <span className="text-emerald-700">

                    −{formatPrice(order.offerDiscount)}

                  </span>

                </div>



                <div className="mt-3 flex justify-between gap-4">

                  <span className="text-gray-500">Coupon discount</span>

                  <span className="text-emerald-700">

                    −{formatPrice(order.couponDiscount)}

                  </span>

                </div>



                <div className="mt-3 flex justify-between gap-4">

                  <span className="text-gray-500">Shipping</span>

                  <span>{formatPrice(order.shippingCharge)}</span>

                </div>



                <div className="mt-5 flex justify-between gap-4 border-t border-gray-200 pt-5">

                  <span className="font-semibold">Total paid / due</span>

                  <span className="text-xl font-semibold text-[#111827]">

                    {formatPrice(order.totalAmount)}

                  </span>

                </div>



                {order.paymentMethod === "COD" &&

                  order.paymentStatus !== "PAID" && (

                    <p className="mt-3 text-xs leading-5 text-gray-500">

                      Payment is due when your order is delivered.

                    </p>

                  )}

              </div>

            </div>

          </section>

        </div>



        <div className="mt-8 flex flex-col gap-3 sm:flex-row">

          <Link

            to="/user/orders"

            className="inline-flex items-center justify-center border border-[#111827] px-6 py-3 text-sm font-medium transition hover:bg-gray-100"

          >

            My Orders

          </Link>



          {order.paymentMethod !== "COD" &&

            order.paymentStatus !== "PAID" &&

            !["CANCELLED", "RETURNED"].includes(status) && (

              <button

                type="button"

                onClick={() =>

                  navigate("/user/checkout", {

                    state: { retryOrderId: order._id },

                  })

                }

                className="inline-flex items-center justify-center bg-[#9A7B3F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#111827]"

              >

                Retry Payment

              </button>

            )}



          <Link

            to="/user/products"

            className="inline-flex items-center justify-center bg-[#111827] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9A7B3F]"

          >

            Continue Shopping

          </Link>

        </div>

      </main>

    </div>

  );

};



export default OrderDetails;