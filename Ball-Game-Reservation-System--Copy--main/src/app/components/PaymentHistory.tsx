import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Receipt, Calendar, CreditCard, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: string;
  type: 'booking' | 'membership';
  reference: string;
};

export function PaymentHistory() {
  const { currentUser, bookings, subscriptionHistory, memberships, courts } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'booking' | 'membership'>('all');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  // 1. Transform Bookings into Transactions
  const bookingTransactions: Transaction[] = bookings
    .filter(b => b.userId === currentUser?.id)
    .map(b => {
      const court = courts.find(c => c.id === b.courtId);
      return {
        id: b.id,
        date: new Date(b.date),
        description: `Court Booking - ${court?.name || 'Unknown Court'}`,
        amount: b.amount || 0,
        status: b.status === 'confirmed' || b.status === 'completed' ? 'paid' : b.status,
        type: 'booking',
        reference: `BK-${b.id.slice(0, 8).toUpperCase()}`
      };
    });

  // 2. Transform Subscriptions into Transactions
  const subTransactions: Transaction[] = subscriptionHistory.map(s => {
    const plan = memberships.find(m => m.id === s.membership_id);
    return {
      id: s.id,
      date: new Date(s.start_date), // Using start date as transaction date
      description: `Membership Subscription - ${plan?.name || 'Unknown Plan'}`,
      amount: s.amount_paid,
      status: 'paid',
      type: 'membership',
      reference: `SUB-${s.id.slice(0, 8).toUpperCase()}`
    };
  });

  // 3. Combine and Sort
  const allTransactions = [...bookingTransactions, ...subTransactions]
    .filter(t => {
      const matchesType = filter === 'all' || t.type === filter;
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && t.date >= startDate;
      }
      if (endDate) {
        matchesDate = matchesDate && t.date <= new Date(endDate.getTime() + 86400000 - 1);
      }
      return matchesType && matchesDate;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalSpent = allTransactions
    .filter(t => t.status === 'paid' || t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadInvoice = (transaction: Transaction) => {
    const invoiceContent = `
INVOICE
-------
Reference: ${transaction.reference}
Date: ${format(transaction.date, 'MMM dd, yyyy HH:mm')}
Description: ${transaction.description}
Amount: ₱${transaction.amount.toFixed(2)}
Status: ${transaction.status.toUpperCase()}

Thank you for your business!
`.trim();

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${transaction.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Invoice downloaded');
  };

  const handleExportCSV = () => {
    if (allTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Reference', 'Description', 'Type', 'Status', 'Amount'];
    const rows = allTransactions.map(t => [
      format(t.date, 'yyyy-MM-dd HH:mm'),
      t.reference,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.status,
      t.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Transactions exported to CSV');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment History</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">View all your transactions and receipts</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-teal-100 dark:shadow-none flex items-center justify-between">
          <div>
            <p className="text-teal-100 mb-1">Total Spent</p>
            <h2 className="text-4xl font-bold">₱{totalSpent.toLocaleString()}</h2>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Receipt size={32} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Type:</span>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="all">All Transactions</option>
              <option value="booking">Bookings</option>
              <option value="membership">Memberships</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Date:</span>
            <div className="relative z-10">
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                placeholderText="Filter by date range"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-56"
              />
            </div>
          </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {allTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <CreditCard size={48} className="mx-auto mb-4 opacity-20" />
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {allTransactions.map((t) => (
                <div key={`${t.type}-${t.id}`} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.type === 'membership' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                      {t.type === 'membership' ? <CreditCard size={20} /> : <Calendar size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{t.description}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{format(t.date, 'MMM dd, yyyy • HH:mm')} • <span className="font-mono text-xs">{t.reference}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">₱{t.amount.toFixed(2)}</p>
                      <p className={`text-xs font-bold uppercase ${t.status === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`}>{t.status}</p>
                    </div>
                    {t.status === 'paid' && (
                      <button 
                        onClick={() => handleDownloadInvoice(t)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-full transition-colors"
                        title="Download Invoice"
                      >
                        <Download size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}