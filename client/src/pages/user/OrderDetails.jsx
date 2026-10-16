
import { useEffect, useState } from "react";
import { Link, useParams,useNavigate } from "react-router-dom";
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

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Unavailable";

  return parsedDate.toLocaleString("en-IN", {
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

const formatStatus = (status) => {
  const value = String(status || "PLACED").toUpperCase();
  return value.charAt(0) + value.slice(1).toLowerCase();
};

const OrderDetails = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/user/order/${orderId}`
        );

        if (!ignore) {
          setOrder(response.data?.order || null);

          if (!response.data?.order) {
            setError("Order details could not be found.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Unable to load order details. Please try again."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      ignore = true;
    };
  }, [orderId]);

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

            <p className="mt-3 text-sm text-gray-500">
              {error || "Order details could not be found."}
            </p>

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
    STATUS_STYLES[status] ||
    "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111827]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8">
        

        {/* Heading */}
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#9A7B3F]">
              OCEANUS · Your collection
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

        {/* Order items */}
        <section className="mt-8 border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-semibold">Items Ordered</h2>
            <p className="mt-1 text-sm text-gray-500">
              {items.length} {items.length === 1 ? "item" : "items"} in this order
            </p>
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No item details are available for this order.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <div
                  key={item._id || item.variantId || index}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7"
                >
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
                    <p className="text-xs text-gray-500">
                      Item total
                    </p>

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
              ))}
            </div>
          )}
        </section>

        {/* Address and payment */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="border border-gray-200 bg-white p-5 sm:p-7">
            <h2 className="text-lg font-semibold">
              Shipping Address
            </h2>

            <div className="mt-5 space-y-2 text-sm leading-6 text-gray-600">
              <p className="font-medium text-[#111827]">
                {address.name || "Name unavailable"}
              </p>

              <p>{address.phone || "Phone unavailable"}</p>

              {address.addressLine && <p>{address.addressLine}</p>}

              <p>
                {[address.city, address.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <p>
                {address.pincode
                  ? `PIN: ${address.pincode}`
                  : ""}
              </p>

              {address.landmark && (
                <p>Landmark: {address.landmark}</p>
              )}
            </div>
          </section>

          <section className="border border-gray-200 bg-white p-5 sm:p-7">
            <h2 className="text-lg font-semibold">
              Payment Information
            </h2>

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

        {/* Footer actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/user/orders"
            className="inline-flex items-center justify-center border border-[#111827] px-6 py-3 text-sm font-medium transition hover:bg-gray-100"
          >
            My Orders
          </Link>

          {order.paymentMethod !== "COD" &&
  order.paymentStatus !== "PAID" &&
  !["CANCELLED", "RETURNED"].includes(
    String(order.orderStatus || "").toUpperCase()
  ) && (
    <button
      type="button"
      onClick={() =>
        navigate("/user/checkout", {
          state: {
            retryOrderId: order._id,
          },
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
