'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SELAgentCard } from '@/types';
import { tokenStorage } from '@/lib/auth';

interface DownloadFormModalProps {
  agent: SELAgentCard;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}

export interface UserFormData {
  purpose: string;
  userId: string;
  businessGroup: string;
  isu: string;
  account: string;
}

interface DownloadContextResponse {
  user: {
    user_id: string;
    email: string;
    role: string;
    businessGroup: string;
    IOU: string;
    account: string;
  };
  profileComplete: boolean;
  downloadCount: number;
  recentDownloads: Array<{
    agentId: string;
    agentName: string;
    version: string;
    purpose: string;
    downloadedAt: string;
  }>;
}

type FormStep = 'profile' | 'details';

export default function DownloadFormModal({
  agent,
  isOpen,
  onClose,
  onSubmit,
}: DownloadFormModalProps) {
  const [step, setStep] = useState<FormStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<DownloadContextResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UserFormData>({
    purpose: '',
    userId: '',
    businessGroup: '',
    isu: '',
    account: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadContext = async () => {
      setIsLoading(true);
      setErrors({});

      try {
        const token = tokenStorage.getAccessToken();
        if (!token) {
          throw new Error('Please sign in before downloading a skill.');
        }

        const response = await fetch('/api/user/download-context', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load user profile.');
        }

        const payload = (await response.json()) as DownloadContextResponse;
        if (!active) return;

        setContext(payload);
        setFormData((current) => ({
          ...current,
          userId: payload.user.user_id,
          businessGroup: payload.user.businessGroup || '',
          isu: payload.user.IOU || '',
          account: payload.user.account || '',
        }));
        setStep(payload.profileComplete ? 'details' : 'profile');
      } catch (error) {
        if (!active) return;
        setErrors({
          submit: error instanceof Error ? error.message : 'Failed to load download context.',
        });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadContext();

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setErrors({});
    setContext(null);
    setFormData({
      purpose: '',
      userId: '',
      businessGroup: '',
      isu: '',
      account: '',
    });
    setStep('details');
    onClose();
  };

  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', submit: '' }));
  };

  const saveProfile = async () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.businessGroup.trim()) nextErrors.businessGroup = 'BG is required';
    if (!formData.isu.trim()) nextErrors.isu = 'ISU is required';
    if (!formData.account.trim()) nextErrors.account = 'Account is required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          businessGroup: formData.businessGroup.trim(),
          IOU: formData.isu.trim(),
          account: formData.account.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to save profile details.');
      }

      setContext((current) =>
        current
          ? {
              ...current,
              profileComplete: true,
              user: {
                ...current.user,
                businessGroup: formData.businessGroup.trim(),
                IOU: formData.isu.trim(),
                account: formData.account.trim(),
              },
            }
          : current
      );
      setStep('details');
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save profile details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitDownload = async () => {
    if (!formData.purpose.trim()) {
      setErrors({ purpose: 'Purpose of download is required' });
      return;
    }

    onSubmit({
      ...formData,
      purpose: formData.purpose.trim(),
      businessGroup: formData.businessGroup.trim(),
      isu: formData.isu.trim(),
      account: formData.account.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {step === 'profile' ? 'Complete Your Profile' : 'Download Skill'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {step === 'profile'
                ? 'We only need these details once. They will be stored in PostgreSQL and reused next time.'
                : 'Your central-auth identity is already linked. Add a short purpose before downloading.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {errors.submit && (
            <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-sm text-error">
              {errors.submit}
            </div>
          )}

          {isLoading && !context ? (
            <p className="text-sm text-text-secondary">Loading your download profile...</p>
          ) : (
            <>
              {context && (
                <div className="rounded-xl border border-border bg-bg-secondary p-4">
                  <p className="text-sm font-semibold text-text-primary">{context.user.user_id}</p>
                  <p className="mt-1 text-sm text-text-secondary">{context.user.email}</p>
                  <p className="mt-3 text-xs text-text-muted">Previous downloads: {context.downloadCount}</p>
                  {context.recentDownloads.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Recent downloads
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                        {context.recentDownloads.slice(0, 3).map((item) => (
                          <li key={`${item.agentId}-${item.downloadedAt}`}>
                            {item.agentName} - {new Date(item.downloadedAt).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {step === 'profile' ? (
                <div className="space-y-4">
                  <div>
                    <label className="sel-label">BG *</label>
                    <input
                      value={formData.businessGroup}
                      onChange={(event) => handleFieldChange('businessGroup', event.target.value)}
                      className="sel-input px-4 py-3"
                      placeholder="Enter your BG"
                    />
                    {errors.businessGroup && <p className="mt-1 text-xs text-error">{errors.businessGroup}</p>}
                  </div>

                  <div>
                    <label className="sel-label">ISU *</label>
                    <input
                      value={formData.isu}
                      onChange={(event) => handleFieldChange('isu', event.target.value)}
                      className="sel-input px-4 py-3"
                      placeholder="Enter your ISU"
                    />
                    {errors.isu && <p className="mt-1 text-xs text-error">{errors.isu}</p>}
                  </div>

                  <div>
                    <label className="sel-label">Account *</label>
                    <input
                      value={formData.account}
                      onChange={(event) => handleFieldChange('account', event.target.value)}
                      className="sel-input px-4 py-3"
                      placeholder="Enter your account"
                    />
                    {errors.account && <p className="mt-1 text-xs text-error">{errors.account}</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-sm text-text-secondary">
                      Downloading <span className="font-semibold text-text-primary">{agent.name}</span>
                    </p>
                    <p className="mt-2 text-xs text-text-muted">
                      BG: {formData.businessGroup || context?.user.businessGroup || 'Not set'} - ISU:{' '}
                      {formData.isu || context?.user.IOU || 'Not set'} - Account:{' '}
                      {formData.account || context?.user.account || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="sel-label">Purpose of Download *</label>
                    <textarea
                      value={formData.purpose}
                      onChange={(event) => handleFieldChange('purpose', event.target.value)}
                      className="sel-input min-h-28 px-4 py-3"
                      placeholder="Why do you need this skill?"
                    />
                    {errors.purpose && <p className="mt-1 text-xs text-error">{errors.purpose}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-border p-6">
          <button onClick={handleClose} className="sel-button-ghost flex-1 border border-border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={step === 'profile' ? saveProfile : submitDownload}
            disabled={isLoading}
            className="sel-button-primary flex-1 px-4 py-2"
          >
            {isLoading ? 'Processing...' : step === 'profile' ? 'Save and Continue' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  );
}
