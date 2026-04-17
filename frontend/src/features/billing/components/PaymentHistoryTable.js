import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CreditCard } from '@phosphor-icons/react';

import { entryOffer, pricingPlans } from '../../../content/pricingContent';
import { formatBillingDate, getConceptLabel } from '../billing.utils';

const PaymentHistoryTable = ({ transactions }) => {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-lg font-medium text-white mb-4">Historial de pagos</h3>

      {safeTransactions.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                    Fecha
                  </th>
                  <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                    Concepto
                  </th>
                  <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                    Monto
                  </th>
                  <th className="text-left text-sm font-medium text-[#A3A3A3] px-6 py-4">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeTransactions.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className="border-b border-[#262626] last:border-0"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white flex items-center gap-2">
                        <Clock size={16} className="text-[#A3A3A3]" />
                        {formatBillingDate(tx.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white capitalize">
                        {getConceptLabel(tx, pricingPlans, entryOffer)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">€{tx.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          tx.payment_status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : tx.payment_status === 'pending' ||
                                tx.payment_status === 'initiated'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {tx.payment_status === 'paid'
                          ? 'Completado'
                          : tx.payment_status === 'pending' ||
                              tx.payment_status === 'initiated'
                            ? 'Pendiente'
                            : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <CreditCard size={48} className="text-[#A3A3A3] mx-auto mb-4" />
          <p className="text-[#A3A3A3]">No hay transacciones todavía</p>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentHistoryTable;
