'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SELAgentCard } from '@/types';

interface DownloadFormModalProps {
  agent: SELAgentCard;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}

export interface UserFormData {
  name: string;
  email: string;
  empId: string;
  isoBg: string;
  account: string;
  purpose: string;
  userId: string; // Generated from empId or iso:account combination
}

interface DownloadTrackingData {
  downloadCount: number;
  needsFeedback: boolean;
  previousDownloads: Array<{
    agentId: string;
    agentName: string;
    downloadDate: string;
  }>;
  isExisting: boolean;
}

interface FeedbackItem {
  agentId: string;
  agentName: string;
  rating: number;
  feedback: string;
}

type FormStep = 'identification' | 'details' | 'feedback';

export default function DownloadFormModal({
  agent,
  isOpen,
  onClose,
  onSubmit,
}: DownloadFormModalProps) {
  const [step, setStep] = useState<FormStep>('identification');
  const [empIdInput, setEmpIdInput] = useState('');
  const [isoInput, setIsoInput] = useState('');
  const [bgInput, setBgInput] = useState('');
  const [accountInput, setAccountInput] = useState('');
  const [empIdNotFound, setEmpIdNotFound] = useState(false); // Show ISO/BG/Account as fallback
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    empId: '',
    isoBg: '',
    account: '',
    purpose: '',
    userId: '',
  });

  const [trackingData, setTrackingData] = useState<DownloadTrackingData | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [idChecked, setIdChecked] = useState(false);

  const checkIdentification = async () => {
    let userId = '';

    // Check Employee ID first (if not yet checked)
    if (!empIdNotFound) {
      if (!/^\d{1,10}$/.test(empIdInput)) {
        setErrors({ identification: 'Employee ID must be 1-10 digits' });
        return;
      }
      userId = `emp:${empIdInput}`;
    } else {
      // Fallback to ISO/BG/Account
      if (!isoInput.trim() || !bgInput.trim() || !accountInput.trim()) {
        setErrors({ identification: 'ISO, BG, and Account fields are required' });
        return;
      }
      userId = `iso:${isoInput.trim()}:${bgInput.trim()}:${accountInput.trim()}`;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`/api/download-tracking?userId=${encodeURIComponent(userId)}`);
      
      if (response.ok) {
        const data = await response.json();
        setTrackingData({
          downloadCount: data.downloadCount,
          isExisting: data.downloadCount > 0,
          needsFeedback: data.needsFeedback,
          previousDownloads: data.previousDownloads || [],
        });
        setFormData((prev) => ({ ...prev, userId }));
        setIdChecked(true);

        // Initialize feedback items if needed
        if (data.needsFeedback && data.previousDownloads && data.previousDownloads.length > 0) {
          const lastTwoDownloads = data.previousDownloads.slice(-2);
          setFeedbackItems(
            lastTwoDownloads.map((d: any) => ({
              agentId: d.agentId,
              agentName: d.agentName,
              rating: 0,
              feedback: '',
            }))
          );
        }
        setStep('details');
      } else if (response.status === 404 && !empIdNotFound) {
        // Employee ID not found - show ISO/BG/Account fields
        setEmpIdNotFound(true);
        setErrors({ identification: 'Employee ID not found. Please use ISO, BG & Account instead.' });
      } else {
        throw new Error('Identification check failed');
      }
    } catch (error) {
      console.error('Error checking identification:', error);
      setErrors({ identification: 'Error checking identification. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewUser = async (iso: string, bg: string, account: string) => {
    const userId = `iso:${iso.trim()}:${bg.trim()}:${account.trim()}`;
    try {
      const response = await fetch('/api/download-tracking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          iso: iso.trim(),
          bg: bg.trim(),
          account: account.trim(),
        }),
      });

      if (response.ok) {
        setFormData((prev) => ({ ...prev, userId }));
        setTrackingData({
          downloadCount: 0,
          isExisting: false,
          needsFeedback: false,
          previousDownloads: [],
        });
        return true;
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
    return false;
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose of download is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFeedback = () => {
    const newErrors: Record<string, string> = {};

    for (const item of feedbackItems) {
      if (item.rating === 0) {
        newErrors[`rating-${item.agentId}`] = 'Rating is required';
      }
      if (!item.feedback.trim()) {
        newErrors[`feedback-${item.agentId}`] = 'Feedback is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleFeedbackChange = (
    agentId: string,
    field: 'rating' | 'feedback',
    value: any
  ) => {
    setFeedbackItems((prev) =>
      prev.map((item) =>
        item.agentId === agentId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleNext = () => {
    if (!validateDetails()) return;

    if (trackingData?.needsFeedback && feedbackItems.length > 0) {
      setStep('feedback');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (step === 'feedback' && !validateFeedback()) return;

    setIsLoading(true);
    try {
      // Submit feedback if on feedback step
      if (step === 'feedback' && feedbackItems.length > 0) {
        const feedbackData = {
          userId: formData.userId,
          agentIds: feedbackItems.map((item) => item.agentId),
          ratings: feedbackItems.reduce(
            (acc, item) => {
              acc[item.agentId] = {
                rating: item.rating,
                feedback: item.feedback,
              };
              return acc;
            },
            {} as Record<string, any>
          ),
        };

        const feedbackResponse = await fetch('/api/feedback-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData),
        });

        if (!feedbackResponse.ok) throw new Error('Failed to submit feedback');
      }

      // Record download
      const trackingData: any = {
        userId: formData.userId,
        agentId: agent['agent id'],
        agentName: agent.name,
      };

      // Add employee info based on userId format
      if (formData.userId.startsWith('emp:')) {
        trackingData.empId = formData.userId.substring(4);
      } else if (formData.userId.startsWith('iso:')) {
        const parts = formData.userId.substring(4).split(':');
        trackingData.iso = parts[0];
        trackingData.bg = parts[1];
        trackingData.account = parts[2];
      }

      const trackingResponse = await fetch('/api/download-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData),
      });

      if (!trackingResponse.ok) throw new Error('Failed to record download');

      // Call the main submit handler
      onSubmit(formData);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('identification');
    setEmpIdInput('');
    setIsoInput('');
    setBgInput('');
    setAccountInput('');
    setEmpIdNotFound(false);
    setIdChecked(false);
    setFormData({
      name: '',
      email: '',
      empId: '',
      isoBg: '',
      account: '',
      purpose: '',
      userId: '',
    });
    setErrors({});
    setTrackingData(null);
    setFeedbackItems([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'identification'
              ? 'Identify Yourself'
              : step === 'details'
              ? 'Download Agent'
              : 'Provide Feedback'}
          </h2>
          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'identification' ? (
            <>
              <p className="text-gray-600 text-sm">
                Provide your Employee ID to check your download history.
              </p>
              
              {/* Employee ID Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Employee ID*
                </label>
                <input
                  type="number"
                  value={empIdInput}
                  onChange={(e) => {
                    setEmpIdInput(e.target.value);
                    if (errors.identification) setErrors({});
                  }}
                  min="0"
                  max="10"
                  disabled={empIdNotFound}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter employee ID (0-10)"
                />
                {errors.identification && (
                  <p className="text-red-500 text-xs mt-1">{errors.identification}</p>
                )}
              </div>

              {/* Fallback ISO/BG/Account Fields */}
              {empIdNotFound && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Your Employee ID was not found. Please provide your ISO, BG & Account details to create a new account.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      BG *
                    </label>
                    <input
                      type="text"
                      value={isoInput}
                      onChange={(e) => {
                        setIsoInput(e.target.value);
                        if (errors.identification) setErrors({});
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Enter your BG"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      ISU *
                    </label>
                    <input
                      type="text"
                      value={bgInput}
                      onChange={(e) => {
                        setBgInput(e.target.value);
                        if (errors.identification) setErrors({});
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Enter your ISU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Account *
                    </label>
                    <input
                      type="text"
                      value={accountInput}
                      onChange={(e) => {
                        setAccountInput(e.target.value);
                        if (errors.identification) setErrors({});
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Enter your account"
                    />
                  </div>
                </>
              )}
            </>
          ) : step === 'details' ? (
            <>
              {/* Existing User Info */}
              {trackingData?.isExisting && (
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-900">
                    <strong>Welcome back!</strong> Download #{trackingData.downloadCount}
                  </p>
                  {trackingData.previousDownloads.length > 0 && (
                    <div className="mt-2 text-xs text-green-800">
                      <p className="font-medium mb-1">Your recent downloads:</p>
                      <ul className="list-disc list-inside">
                        {trackingData.previousDownloads.slice(-3).map((dl) => (
                          <li key={dl.agentId}>{dl.agentName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {trackingData.needsFeedback && (
                    <p className="text-sm text-amber-700 mt-2 font-medium">
                      ⚠️ This is your 3rd download. Feedback required before proceeding.
                    </p>
                  )}
                </div>
              )}

              {/* New User Info */}
              {!trackingData?.isExisting && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>New User</strong> - Welcome! Please provide your download purpose.
                  </p>
                </div>
              )}

              {/* Purpose Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Purpose of Download *
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => handleFormChange('purpose', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Why do you need this agent?"
                  rows={3}
                />
                {errors.purpose && (
                  <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Feedback Step */}
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Please rate and provide feedback for your last 2 downloaded agents:
                </p>

                <div className="space-y-4">
                  {feedbackItems.map((item) => (
                    <div
                      key={item.agentId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900 mb-3">
                        {item.agentName}
                      </h4>

                      {/* Rating */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Rating (1-5) *
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() =>
                                handleFeedbackChange(item.agentId, 'rating', star)
                              }
                              className={`w-10 h-10 rounded border-2 transition-colors ${
                                item.rating >= star
                                  ? 'border-yellow-400 bg-yellow-50'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                        {errors[`rating-${item.agentId}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`rating-${item.agentId}`]}
                          </p>
                        )}
                      </div>

                      {/* Feedback */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Your Feedback *
                        </label>
                        <textarea
                          value={item.feedback}
                          onChange={(e) =>
                            handleFeedbackChange(item.agentId, 'feedback', e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="Share your experience with this agent"
                          rows={2}
                        />
                        {errors[`feedback-${item.agentId}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`feedback-${item.agentId}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => {
              onClose();
              handleReset();
            }}
            className="
              flex-1 px-4 py-2 rounded-lg border border-gray-300
              text-gray-700 font-medium hover:bg-gray-50
              transition-colors duration-200
            "
          >
            Cancel
          </button>
          {step === 'details' && (
            <button
              onClick={() => {
                handleReset();
              }}
              className="
                flex-1 px-4 py-2 rounded-lg border border-gray-300
                text-gray-700 font-medium hover:bg-gray-50
                transition-colors duration-200
              "
            >
              Change ID
            </button>
          )}
          {step === 'feedback' && (
            <button
              onClick={() => setStep('details')}
              className="
                flex-1 px-4 py-2 rounded-lg border border-gray-300
                text-gray-700 font-medium hover:bg-gray-50
                transition-colors duration-200
              "
            >
              Back
            </button>
          )}
          <button
            onClick={async () => {
              if (step === 'identification') {
                if (empIdNotFound) {
                  // Create new user with ISO/BG/Account
                  if (!isoInput.trim() || !bgInput.trim() || !accountInput.trim()) {
                    setErrors({ identification: 'ISO, BG, and Account fields are required' });
                    return;
                  }
                  setIsLoading(true);
                  const success = await createNewUser(isoInput, bgInput, accountInput);
                  setIsLoading(false);
                  if (success) {
                    setIdChecked(true);
                    setStep('details');
                  } else {
                    setErrors({ identification: 'Failed to create user account' });
                  }
                } else {
                  checkIdentification();
                }
              } else if (step === 'details') {
                handleNext();
              } else {
                handleSubmit();
              }
            }}
            disabled={isLoading}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-blue-600 hover:bg-blue-700
              text-white font-medium
              transition-colors duration-200
              disabled:bg-gray-400 disabled:cursor-not-allowed
            "
          >
            {isLoading
              ? 'Processing...'
              : step === 'identification'
              ? empIdNotFound ? 'Create Account' : 'Next'
              : step === 'details'
              ? 'Next'
              : 'Submit & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
