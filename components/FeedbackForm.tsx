'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  agentId: string;
  agentName: string;
}

const AGENT_FEATURES = [
  'Code Quality',
  'Performance',
  'Documentation',
  'Ease of Use',
  'Reliability',
  'Feature Completeness',
  'Support',
  'Installation',
  'Customization',
  'Other',
];

export default function FeedbackForm({ agentId, agentName }: FeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    feature: '',
    rating: 5,
    comment: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.feature || !formData.comment.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          feature: formData.feature,
          rating: formData.rating,
          comment: formData.comment.trim(),
          email: formData.email || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setFormData({ feature: '', rating: 5, comment: '', email: '' });

      // Reset submitted state after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isOpen
              ? 'bg-gray-200 text-gray-900'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOpen ? 'Close' : 'Share Feedback'}
        </button>
      </div>

      {isOpen && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You!
              </h3>
              <p className="text-gray-600 text-center">
                Your feedback helps us improve this agent. We appreciate your input!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  What feature would you like to provide feedback on? *
                </label>
                <select
                  value={formData.feature}
                  onChange={(e) =>
                    setFormData({ ...formData, feature: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200"
                  required
                >
                  <option value="">Select a feature...</option>
                  {AGENT_FEATURES.map((feature) => (
                    <option key={feature} value={feature}>
                      {feature}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  How would you rate this feature? *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: num })}
                      className={`w-12 h-12 rounded-lg font-bold text-lg transition-all duration-200 ${
                        formData.rating === num
                          ? 'bg-blue-600 text-white scale-110'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {formData.rating <= 2
                    ? 'Needs improvement'
                    : formData.rating === 3
                      ? 'Average'
                      : formData.rating === 4
                        ? 'Good'
                        : 'Excellent'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your feedback (max 500 characters) *
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comment: e.target.value.slice(0, 500),
                    })
                  }
                  placeholder="Share your thoughts, suggestions, or issues..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200 resize-none h-24"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  {formData.comment.length}/500
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email (optional) - for follow-up
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-600 focus:border-transparent
                    outline-none transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2
                  bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                  transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
