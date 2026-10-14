
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/axios";

const OrderSuccess = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/user/order/${orderId}`);

        if (!cancelled) {
          setOrder(response.data.order);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Unable to load your order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        Loading your order...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white p-8 text-center">
        <p className="text-red-600">
          {error || "Order not found."}
        </p>
        <Link to="/user/orders" className="mt-4 inline-block underline">
          Go to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16 text-[#111827]">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center
                        rounded-full bg-green-100 text-3xl text-green-700">
          ✓
        </div>

        <h1 className="text-3xl font-semibold">
          Order placed successfully
        </h1>

        <p className="mt-3 text-gray-600">
          Thank you for shopping with OCEANUS.
        </p>

        <div className="mt-8 rounded-xl border border-gray-200 p-6 text-left">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Order number</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>

          <div className="mt-4 flex justify-between gap-4">
            <span className="text-gray-500">Payment method</span>
            <span>{order.paymentMethod}</span>
          </div>

          <div className="mt-4 flex justify-between gap-4">
            <span className="text-gray-500">Payment status</span>
            <span>{order.paymentStatus}</span>
          </div>

          <div className="mt-4 flex justify-between gap-4">
            <span className="text-gray-500">Order status</span>
            <span>{order.orderStatus}</span>
          </div>

          <div className="mt-5 border-t pt-5 flex justify-between gap-4">
            <span className="font-medium">Total</span>
            <span className="font-semibold">
              ₹{Number(order.totalAmount).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {order.paymentMethod === "COD" && (
          <p className="mt-5 text-sm text-gray-600">
            Please pay when your order is delivered.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/user/orders"
            className="rounded-lg bg-[#111827] px-6 py-3 text-white"
          >
            View My Orders
          </Link>

          <Link
            to="/user/collections"
            className="rounded-lg border border-gray-300 px-6 py-3"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
