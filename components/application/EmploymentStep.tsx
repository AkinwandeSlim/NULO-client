import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmploymentStepProps {
  formData: any
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export default function EmploymentStep({ formData, errors, onChange }: EmploymentStepProps) {
  return (
    <div className="space-y-6">
      {/* Employment Status */}
      <div>
        <Label htmlFor="employmentStatus">Employment Status *</Label>
        <select
          id="employmentStatus"
          name="employmentStatus"
          value={formData.employmentStatus}
          onChange={onChange}
          className={`mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm ${
            errors.employmentStatus ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select status</option>
          <option value="employed">Employed</option>
          <option value="self-employed">Self-Employed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
          <option value="unemployed">Unemployed</option>
        </select>
        {errors.employmentStatus && (
          <p className="text-sm text-red-600 mt-1">{errors.employmentStatus}</p>
        )}
      </div>

      {/* Show employment fields if employed or self-employed */}
      {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employer */}
          <div>
            <Label htmlFor="employer">
              {formData.employmentStatus === 'self-employed' ? 'Business Name' : 'Employer Name'} *
            </Label>
            <Input
              id="employer_name"
              name="employer_name"
              value={formData.employer_name}
              onChange={onChange}
              className={`mt-2 ${errors.employer_name ? 'border-red-500' : ''}`}
              placeholder={formData.employmentStatus === 'self-employed' ? 'Your Business' : 'Company Name'}
            />
            {errors.employer_name && (
              <p className="text-sm text-red-600 mt-1">{errors.employer_name}</p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <Label htmlFor="jobTitle">
              {formData.employmentStatus === 'self-employed' ? 'Business Type' : 'Job Title'} *
            </Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={onChange}
              className={`mt-2 ${errors.jobTitle ? 'border-red-500' : ''}`}
              placeholder={formData.employmentStatus === 'self-employed' ? 'E-commerce' : 'Software Engineer'}
            />
            {errors.jobTitle && (
              <p className="text-sm text-red-600 mt-1">{errors.jobTitle}</p>
            )}
          </div>

          {/* Monthly Income */}
          <div>
            <Label htmlFor="monthlyIncome">Monthly Income (₦) *</Label>
            <Input
              id="monthly_income"
              name="monthly_income"
              type="number"
              value={formData.monthly_income}
              onChange={onChange}
              className={`mt-2 ${errors.monthly_income ? 'border-red-500' : ''}`}
              placeholder="500000"
            />
            {errors.monthly_income && (
              <p className="text-sm text-red-600 mt-1">{errors.monthly_income}</p>
            )}
          </div>

          {/* Employment Duration */}
          <div>
            <Label htmlFor="employmentDuration">How long have you been {formData.employmentStatus === 'self-employed' ? 'in business' : 'employed'}?</Label>
            <select
              id="employmentDuration"
              name="employmentDuration"
              value={formData.employmentDuration}
              onChange={onChange}
              className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Select duration</option>
              <option value="less-than-6-months">Less than 6 months</option>
              <option value="6-12-months">6-12 months</option>
              <option value="1-2-years">1-2 years</option>
              <option value="2-5-years">2-5 years</option>
              <option value="more-than-5-years">More than 5 years</option>
            </select>
          </div>

          {/* Previous Employer (Optional) */}
          <div className="md:col-span-2">
            <Label htmlFor="previousEmployer">Previous Employer (Optional)</Label>
            <Input
              id="previousEmployer"
              name="previousEmployer"
              value={formData.previousEmployer}
              onChange={onChange}
              className="mt-2"
              placeholder="Previous company name"
            />
          </div>
        </div>
      )}

      {/* Student Information */}
      {formData.employmentStatus === 'student' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="employer">Institution Name *</Label>
            <Input
              id="employer_name"
              name="employer_name"
              value={formData.employer_name}
              onChange={onChange}
              className={`mt-2 ${errors.employer_name ? 'border-red-500' : ''}`}
              placeholder="University of Lagos"
            />
            {errors.employer_name && (
              <p className="text-sm text-red-600 mt-1">{errors.employer_name}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="jobTitle">Course of Study *</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={onChange}
              className={`mt-2 ${errors.jobTitle ? 'border-red-500' : ''}`}
              placeholder="Computer Science"
            />
            {errors.jobTitle && (
              <p className="text-sm text-red-600 mt-1">{errors.jobTitle}</p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Note for Students:</strong> You may need a guarantor or proof of financial support to complete your application.
            </p>
          </div>
        </div>
      )}

      {/* Unemployed/Retired Information */}
      {(formData.employmentStatus === 'unemployed' || formData.employmentStatus === 'retired') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> You may be required to provide additional documentation such as bank statements or proof of savings to demonstrate your ability to pay rent.
          </p>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-slate-700">
          <strong>Privacy Notice:</strong> Your employment and income information is confidential and will only be shared with the property owner for verification purposes.
        </p>
      </div>
    </div>
  )
}
