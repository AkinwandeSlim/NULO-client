"use client"

import { CheckCircle } from "lucide-react"

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, name: 'Profile' },
    { number: 2, name: 'Property' },
    { number: 3, name: 'Payment' },
    { number: 4, name: 'Protection' }
  ]

  return (
    <div className="flex items-center justify-between mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
            ${currentStep >= step.number 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-200 text-gray-600'
            }
          `}>
            {currentStep > step.number ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              step.number
            )}
          </div>
          <span className="ml-2 text-sm font-medium hidden sm:block">{step.name}</span>
          {index < steps.length - 1 && (
            <div className={`
              flex-1 h-0.5 mx-2 sm:mx-4
              ${currentStep > step.number ? 'bg-orange-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  )
}
