import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import client from "../api/client";
import { formatCurrency } from "../utils/formatters";

export const TransactionForm = ({ type, accounts, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fromAccountId: accounts[0]?.id || "",
    amount: "",
    toAccountNumber: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let endpoint = "";
      let payload = {};

      if (type === "deposit") {
        endpoint = "/transactions/deposit";
        payload = {
          accountId: formData.fromAccountId,
          amount: parseFloat(formData.amount),
          description: formData.description,
        };
      } else if (type === "withdraw") {
        endpoint = "/transactions/withdraw";
        payload = {
          accountId: formData.fromAccountId,
          amount: parseFloat(formData.amount),
          description: formData.description,
        };
      } else if (type === "transfer") {
        endpoint = "/transactions/transfer";
        payload = {
          fromAccountId: formData.fromAccountId,
          toAccountNumber: formData.toAccountNumber,
          amount: parseFloat(formData.amount),
          description: formData.description,
        };
      }

      await client.post(endpoint, payload);
      setShowSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const isValid =
    formData.fromAccountId &&
    formData.amount &&
    amount > 0 &&
    (type !== "transfer" || formData.toAccountNumber);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-sm flex gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-2">
          {type === "transfer" ? "From Account" : "Account"}
        </label>
        <select
          value={formData.fromAccountId}
          onChange={(e) =>
            setFormData({ ...formData, fromAccountId: e.target.value })
          }
          className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        >
          <option value="">Select account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.type} - {acc.accountNumber} ({formatCurrency(acc.balance)})
            </option>
          ))}
        </select>
      </div>

      {type === "transfer" && (
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-2">
            To Account Number
          </label>
          <input
            type="text"
            value={formData.toAccountNumber}
            onChange={(e) =>
              setFormData({ ...formData, toAccountNumber: e.target.value })
            }
            placeholder="16-digit account number"
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-2">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-2 text-navy-600 font-medium">
            $
          </span>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="w-full pl-8 pr-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-2">
          Description (optional)
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Add a note"
          className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-navy-100 hover:bg-navy-200 text-navy-900 py-2 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {showSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Success!
            </>
          ) : isSubmitting ? (
            "Processing..."
          ) : (
            "Confirm"
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
