/**
 * Trial and Payment Components for Plutus Predict
 */
import React from 'react';
import { Clock, CreditCard, X } from 'lucide-react';
import { Button } from '../ui/button';

export const TrialBanner = ({ trialStatus, onUpgrade }) => {
  if (!trialStatus?.is_trial) return null;
  
  const remainingMinutes = Math.ceil((trialStatus.remaining_seconds || 0) / 60);
  const isLow = remainingMinutes < 10;
  
  return (
    <div className={`fixed bottom-4 right-4 z-40 p-4 rounded-lg border ${isLow ? 'bg-[#FF3333]/10 border-[#FF3333]/30' : 'bg-[#FFD700]/10 border-[#FFD700]/30'}`}>
      <div className="flex items-center gap-3">
        <Clock className={`w-5 h-5 ${isLow ? 'text-[#FF3333]' : 'text-[#FFD700]'}`} />
        <div>
          <div className="text-sm font-bold text-white">
            Trial: {remainingMinutes} min remaining
          </div>
          <div className="text-xs text-[#888]">
            Upgrade for unlimited access
          </div>
        </div>
        <Button 
          onClick={onUpgrade}
          size="sm"
          className="bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80"
        >
          Upgrade
        </Button>
      </div>
    </div>
  );
};

export const PaymentRequiredModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#888] hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-[#FF3333]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-[#FF3333]" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Trial Expired</h2>
          <p className="text-[#888] mb-6">
            Your 60-minute free trial has ended. Upgrade to continue accessing Plutus Predict's AI forecasting capabilities.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={onUpgrade}
              className="w-full bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full border-[#1F1F1F] text-[#888]"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default { TrialBanner, PaymentRequiredModal };
