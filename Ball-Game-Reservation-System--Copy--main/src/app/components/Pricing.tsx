import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Check, Plus, Edit2, Trash2, X, CreditCard, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { MembershipPlan, MembershipTier } from '@/types';

export default function Pricing() {
  const { memberships, currentUser, addMembership, updateMembership, deleteMembership, subscribe } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    interval: 'month' | 'year';
    tier: MembershipTier;
    description: string;
    features: string;
  }>({
    name: '',
    price: '',
    interval: 'month',
    tier: 'basic',
    description: '',
    features: ''
  });

  const isAdmin = currentUser?.role === 'admin';

  const handleEdit = (plan: MembershipPlan) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      interval: plan.interval,
      tier: plan.tier || 'basic',
      description: plan.description,
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await deleteMembership(id);
        toast.success('Plan deleted successfully');
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        name: formData.name,
        price: Number(formData.price),
        interval: formData.interval,
        tier: formData.tier,
        description: formData.description,
        features: formData.features.split('\n').filter(f => f.trim())
      };

      if (editingId) {
        await updateMembership(editingId, planData);
        toast.success('Plan updated successfully');
      } else {
        await addMembership(planData);
        toast.success('Plan created successfully');
      }
      setIsModalOpen(false);
      setFormData({ name: '', price: '', interval: 'month', tier: 'basic', description: '', features: '' });
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to save plan');
    }
  };

  const handleSubscribeClick = (planId: string) => {
    setSelectedPlanId(planId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    
    setIsProcessing(true);
    try {
      await subscribe(selectedPlanId);
      toast.success('Subscription activated successfully!');
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Membership Plans</h1>
          <p className="text-slate-500 dark:text-slate-400">Choose the perfect plan for your needs.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', price: '', interval: 'month', tier: 'basic', description: '', features: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 dark:shadow-none"
          >
            <Plus size={20} />
            Add Plan
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {memberships.map((plan: MembershipPlan) => (
          <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-md transition-all relative group">
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(plan)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
            <div className="mt-4 flex items-baseline text-slate-900 dark:text-white">
              <span className="text-4xl font-bold tracking-tight">₱{plan.price}</span>
              <span className="ml-1 text-xl font-semibold text-slate-500 dark:text-slate-400">/{plan.interval}</span>
            </div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">{plan.description}</p>

            <ul className="mt-8 space-y-4">
              {plan.features?.map((feature: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => isAdmin ? handleEdit(plan) : handleSubscribeClick(plan.id)}
              className="w-full mt-8 py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              {isAdmin ? 'Edit Plan' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Plan' : 'Add New Plan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Pro Membership"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tier</label>
                  <select 
                    value={formData.tier}
                    onChange={e => setFormData({...formData, tier: e.target.value as MembershipTier})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (₱)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interval</label>
                  <select 
                    value={formData.interval}
                    onChange={e => setFormData({...formData, interval: e.target.value as 'month' | 'year'})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Brief description of the plan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Features (one per line)</label>
                <textarea 
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                  placeholder="Access to all courts&#10;Priority booking&#10;Free equipment rental"
                />
              </div>
              <div className="flex justify-end pt-4 gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100 dark:shadow-none"
                >
                  {editingId ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={20} className="text-teal-600" />
                Secure Payment
              </h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₱{memberships.find((m: MembershipPlan) => m.id === selectedPlanId)?.price}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                  <input required type="text" placeholder="MM/YY" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVC</label>
                  <input required type="text" placeholder="123" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Pay & Subscribe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}