import { useState } from "react";

type CheckoutParams = {
  amount: number;
  splitId: string;
};

export const usePaymentCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const isWalletConnected = () => {
    // replace with real wallet hook
    return Boolean(window?.ethereum?.selectedAddress);
  };

  const isCorrectNetwork = () => {
    // replace with real chain check
    return true;
  };

  const submitPayment = async (params: CheckoutParams) => {
    const { splitId } = params;

    // 🚫 prevent duplicate submits
    if (loading || lastSubmittedId === splitId) return;

    setError(null);

    if (!isWalletConnected()) {
      setError("Wallet not connected");
      return;
    }

    if (!isCorrectNetwork()) {
      setError("Wrong network");
      return;
    }

    try {
      setLoading(true);
      setLastSubmittedId(splitId);

      // simulate payment request
      await new Promise((res) => setTimeout(res, 1000));

      // replace with real API call
      console.log("Payment successful for split:", splitId);
    } catch (e: any) {
      setError(e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    submitPayment,
    loading,
    error,
    isWalletConnected: isWalletConnected(),
    isCorrectNetwork: isCorrectNetwork(),
  };
};