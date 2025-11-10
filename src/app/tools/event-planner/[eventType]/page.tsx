'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EventQuestionnaire() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    eventType: params.eventType,
    guestCount: '',
    date: '',
    budget: '',
    venue: '',
    priorities: [],
  });

  const questions = [
    {
      id: 'guestCount',
      question: 'How many guests are you expecting?',
      type: 'select',
      options: [
        '0-25 (Intimate)',
        '26-50 (Small)',
        '51-100 (Medium)',
        '101-200 (Large)',
        '200+ (Very Large)',
      ],
    },
    {
      id: 'date',
      question: 'When is your event?',
      type: 'select',
      options: [
        'Within 1 month',
        '1-3 months',
        '3-6 months',
        '6-12 months',
        'Over a year away',
      ],
    },
    {
      id: 'budget',
      question: 'What\'s your approximate budget?',
      type: 'select',
      options: [
        'Under $1,000',
        '$1,000 - $5,000',
        '$5,000 - $10,000',
        '$10,000 - $25,000',
        '$25,000+',
      ],
    },
    {
      id: 'venue',
      question: 'What type of venue?',
      type: 'select',
      options: [
        'Indoor (hotel, banquet hall)',
        'Outdoor (garden, beach, park)',
        'Home or backyard',
        'Restaurant or bar',
        'Unique venue (barn, museum, etc.)',
        'Not sure yet',
      ],
    },
    {
      id: 'priorities',
      question: 'What matters most to you? (Select all that apply)',
      type: 'multiselect',
      options: [
        'Amazing photos',
        'Great food',
        'Fun entertainment',
        'Beautiful decor',
        'Guest experience',
        'Staying on budget',
      ],
    },
  ];

  const currentQuestion = questions[step];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Save form data to localStorage before navigating
      localStorage.setItem(`event-form-${params.eventType}`, JSON.stringify(formData));
      router.push(`/tools/event-planner/${params.eventType}/plan`);
    }
  };

  const handleChange = (value: string) => {
    if (currentQuestion.type === 'multiselect') {
      const current = (formData[currentQuestion.id as keyof typeof formData] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFormData({ ...formData, [currentQuestion.id]: updated });
    } else {
      setFormData({ ...formData, [currentQuestion.id]: value });
    }
  };

  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center">
      <div className="max-w-2xl mx-auto px-4 py-16 w-full">
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {step + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = currentQuestion.type === 'multiselect'
                ? ((formData[currentQuestion.id as keyof typeof formData] as string[]) || []).includes(option)
                : formData[currentQuestion.id as keyof typeof formData] === option;

              return (
                <button
                  key={option}
                  onClick={() => handleChange(option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-900">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={
              !formData[currentQuestion.id as keyof typeof formData] || 
              (currentQuestion.type === 'multiselect' && 
              ((formData[currentQuestion.id as keyof typeof formData] as string[]) || []).length === 0)
            }
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step < questions.length - 1 ? 'Next Question' : 'Generate My Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
