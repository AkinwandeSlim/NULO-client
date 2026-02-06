import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, FileText, User, Briefcase, Users, Upload, Home, Calendar } from "lucide-react"

interface ReviewStepProps {
  formData: any
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  property: any
}

export default function ReviewStep({ formData, errors, onChange, property }: ReviewStepProps) {
  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
      <Icon className="h-5 w-5 text-orange-600" />
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    </div>
  )

  const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between py-2">
      <span className="text-sm text-slate-600">{label}:</span>
      <span className="text-sm font-medium text-slate-900">{value || 'Not provided'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Property Information */}
      {property && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-6">
          <SectionHeader icon={Home} title="Property Details" />
          <div className="space-y-2">
            <InfoRow label="Property" value={property.title} />
            <InfoRow label="Location" value={property.location} />
            <InfoRow label="Monthly Rent" value={`₦${property.price?.toLocaleString()}`} />
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <SectionHeader icon={User} title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow label="Full Name" value={`${formData.firstName} ${formData.lastName}`} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="Phone" value={formData.phone} />
          <InfoRow label="Date of Birth" value={formData.dateOfBirth} />
          <InfoRow label="Nationality" value={formData.nationality} />
          <InfoRow label="Marital Status" value={formData.maritalStatus} />
          <InfoRow label="Dependents" value={formData.dependents} />
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <SectionHeader icon={Briefcase} title="Employment Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <InfoRow label="Employment Status" value={formData.employmentStatus} />
          <InfoRow label="Employer" value={formData.employer} />
          <InfoRow label="Job Title" value={formData.jobTitle} />
          <InfoRow label="Monthly Income" value={formData.monthlyIncome ? `₦${parseInt(formData.monthlyIncome).toLocaleString()}` : ''} />
          <InfoRow label="Employment Duration" value={formData.employmentDuration} />
        </div>
      </div>

      {/* References */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <SectionHeader icon={Users} title="References" />
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-2">Reference 1</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="Name" value={formData.reference1Name} />
              <InfoRow label="Phone" value={formData.reference1Phone} />
              <InfoRow label="Relationship" value={formData.reference1Relationship} />
            </div>
          </div>
          
          {formData.reference2Name && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-2">Reference 2</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <InfoRow label="Name" value={formData.reference2Name} />
                <InfoRow label="Phone" value={formData.reference2Phone} />
                <InfoRow label="Relationship" value={formData.reference2Relationship} />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-2">Emergency Contact</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <InfoRow label="Name" value={formData.emergencyContactName} />
              <InfoRow label="Phone" value={formData.emergencyContactPhone} />
              <InfoRow label="Relationship" value={formData.emergencyContactRelationship} />
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <SectionHeader icon={Upload} title="Uploaded Documents" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {formData.idDocument ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
            )}
            <span className="text-sm text-slate-700">Government-Issued ID</span>
            {formData.idDocument && (
              <span className="text-xs text-slate-500 ml-auto">{formData.idDocument.name}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {formData.proofOfIncome ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
            )}
            <span className="text-sm text-slate-700">Proof of Income</span>
            {formData.proofOfIncome && (
              <span className="text-xs text-slate-500 ml-auto">{formData.proofOfIncome.name}</span>
            )}
          </div>
          
          {formData.bankStatement && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-slate-700">Bank Statement</span>
              <span className="text-xs text-slate-500 ml-auto">{formData.bankStatement.name}</span>
            </div>
          )}
          
          {formData.employmentLetter && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-slate-700">Employment Letter</span>
              <span className="text-xs text-slate-500 ml-auto">{formData.employmentLetter.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <SectionHeader icon={Calendar} title="Lease Details" />
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="moveInDate">Preferred Move-in Date *</Label>
            <Input
              id="moveInDate"
              name="moveInDate"
              type="date"
              value={formData.moveInDate}
              onChange={onChange}
              className={`mt-2 ${errors.moveInDate ? 'border-red-500' : ''}`}
            />
            {errors.moveInDate && (
              <p className="text-sm text-red-600 mt-1">{errors.moveInDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="leaseDuration">Preferred Lease Duration</Label>
            <select
              id="leaseDuration"
              name="leaseDuration"
              value={formData.leaseDuration}
              onChange={onChange}
              className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pets">Do you have pets?</Label>
              <select
                id="pets"
                name="pets"
                value={formData.pets}
                onChange={onChange}
                className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div>
              <Label htmlFor="smoking">Do you smoke?</Label>
              <select
                id="smoking"
                name="smoking"
                value={formData.smoking}
                onChange={onChange}
                className="mt-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={onChange}
              className="mt-2"
              rows={4}
              placeholder="Any additional information you'd like the landlord to know..."
            />
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreeToTerms"
            name="agreeToTerms"
            checked={formData.agreeToTerms || false}
            onChange={(e) => {
              // Create a synthetic event with checked property
              const syntheticEvent = {
                target: {
                  name: 'agreeToTerms',
                  value: e.target.checked,
                  type: 'checkbox',
                  checked: e.target.checked
                }
              } as unknown as React.ChangeEvent<HTMLInputElement>
              onChange(syntheticEvent)
            }}
            className={`mt-1 h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer ${
              errors.agreeToTerms ? 'border-red-500' : ''
            }`}
          />
          <div className="flex-1">
            <Label htmlFor="agreeToTerms" className="text-sm font-medium text-slate-900 cursor-pointer">
              I confirm that all information provided is accurate and complete *
            </Label>
            <p className="text-xs text-slate-600 mt-2">
              By submitting this application, you agree to our{' '}
              <a href="/terms" className="text-orange-600 hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-orange-600 hover:underline">Privacy Policy</a>. 
              You authorize the landlord to verify the information provided and contact your references.
            </p>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-600 mt-2 font-medium">{errors.agreeToTerms}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>What happens next?</strong> After you submit your application, the landlord will review it and may contact you for additional information or to schedule a viewing. You'll receive a notification once the landlord makes a decision.
        </p>
      </div>
    </div>
  )
}
