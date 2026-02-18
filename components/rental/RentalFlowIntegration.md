# 🔗 Rental Flow Integration Guide

## 🎯 **Complete Integration with Property Discovery**

This guide shows how to integrate the rental application flow with your existing property discovery system.

---

## 📋 **Integration Points**

### **1. PropertyCard Component Updates**

Update your `PropertyCard.tsx` to include rental flow actions:

```typescript
// Add these imports
import ViewingRequestModal from '@/components/rental/ViewingRequestModal'
import ApplicationForm from '@/components/rental/ApplicationForm'
import { useAuth } from '@/contexts/AuthContext'

// Add state for modals
const [showViewingModal, setShowViewingModal] = useState(false)
const [showApplicationModal, setShowApplicationModal] = useState(false)
const { user } = useAuth()

// Add action buttons in the card
const actionButtons = (
  <div className="flex gap-2 mt-3">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowViewingModal(true)}
      className="flex-1"
    >
      <Calendar className="w-3 h-3 mr-1" />
      Schedule Viewing
    </Button>
    
    <Button
      size="sm"
      onClick={() => setShowApplicationModal(true)}
      className="flex-1 bg-orange-600 hover:bg-orange-700"
    >
      <FileText className="w-3 h-3 mr-1" />
      Apply Now
    </Button>
  </div>
)

// Add modals to the component
{showViewingModal && (
  <ViewingRequestModal
    property={property}
    isOpen={showViewingModal}
    onClose={() => setShowViewingModal(false)}
    user={user}
  />
)}

{showApplicationModal && (
  <ApplicationForm
    property={property}
    isOpen={showApplicationModal}
    onClose={() => setShowApplicationModal(false)}
    user={user}
  />
)}
```

### **2. Property Detail Page Updates**

Update your property detail page to show progressive actions:

```typescript
// In your property detail page component
const [hasViewed, setHasViewed] = useState(false)
const [hasApplied, setHasApplied] = useState(false)
const [viewingRequest, setViewingRequest] = useState(null)

// Check user's status with this property
useEffect(() => {
  if (user && property) {
    checkUserPropertyStatus()
  }
}, [user, property])

const checkUserPropertyStatus = async () => {
  // Check if user has viewed this property
  const viewingResponse = await viewingRequestsAPI.getMyRequests()
  const userViewing = viewingResponse.data?.find(
    req => req.property_id === property.id && req.status !== 'cancelled'
  )
  
  if (userViewing) {
    setHasViewed(true)
    setViewingRequest(userViewing)
  }

  // Check if user has applied to this property
  const applicationResponse = await applicationsAPI.getMyApplications()
  const userApplication = applicationResponse.data?.find(
    app => app.property_id === property.id
  )
  
  if (userApplication) {
    setHasApplied(true)
  }
}

// Progressive action buttons
const renderActionButtons = () => {
  if (!user) {
    return (
      <Button onClick={() => router.push('/signin')} className="w-full">
        Sign Up to Apply
      </Button>
    )
  }

  if (!hasViewed) {
    return (
      <Button 
        onClick={() => setShowViewingModal(true)}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        Schedule Viewing First
      </Button>
    )
  }

  if (!hasApplied) {
    return (
      <Button 
        onClick={() => setShowApplicationModal(true)}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        Apply for This Property
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Badge variant="outline" className="w-full justify-center">
        Application Submitted
      </Badge>
      <Button 
        variant="outline"
        onClick={() => router.push('/dashboard/applications')}
        className="w-full"
      >
        View Application Status
      </Button>
    </div>
  )
}
```

---

## 🔄 **Complete User Flow Implementation**

### **Step 1: Property Discovery → Viewing Request**

```typescript
// PropertyCard.tsx
const handleViewingRequest = () => {
  if (!user) {
    // Show signup prompt
    setShowSignupPrompt(true)
    return
  }
  
  setShowViewingModal(true)
}

// ViewingRequestModal handles the rest
<ViewingRequestModal
  property={property}
  isOpen={showViewingModal}
  onClose={() => setShowViewingModal(false)}
  onSuccess={(viewingRequest) => {
    // Update UI to show viewing scheduled
    setHasViewed(true)
    setViewingRequest(viewingRequest)
    toast.success('Viewing request submitted!')
  }}
  user={user}
/>
```

### **Step 2: Viewing Request → Application**

```typescript
// After viewing is confirmed, enable application
useEffect(() => {
  if (viewingRequest?.status === 'confirmed') {
    setCanApply(true)
  }
}, [viewingRequest])

// ApplicationForm component
<ApplicationForm
  property={property}
  viewingRequest={viewingRequest}
  isOpen={showApplicationModal}
  onClose={() => setShowApplicationModal(false)}
  onSuccess={(application) => {
    setHasApplied(true)
    toast.success('Application submitted successfully!')
  }}
  user={user}
/>
```

### **Step 3: Application → Agreement**

```typescript
// After application is approved
const handleAgreementSigning = () => {
  if (application?.status === 'approved') {
    router.push(`/dashboard/agreements/${application.id}`)
  }
}
```

---

## 📱 **Mobile-Responsive Design**

### **Property Card Mobile Actions**

```typescript
// Mobile-optimized action buttons
<div className="flex flex-col gap-2 sm:flex-row">
  <Button
    size="sm"
    variant="outline"
    onClick={() => setShowViewingModal(true)}
    className="flex-1"
  >
    <Calendar className="w-3 h-3 mr-1" />
    <span className="hidden sm:inline">Schedule</span>
    <span className="sm:hidden">View</span>
  </Button>
  
  <Button
    size="sm"
    onClick={() => setShowApplicationModal(true)}
    className="flex-1 bg-orange-600 hover:bg-orange-700"
  >
    <FileText className="w-3 h-3 mr-1" />
    Apply
  </Button>
</div>
```

### **Modal Mobile Optimization**

```typescript
// In ViewingRequestModal and ApplicationForm
<DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
  {/* Content */}
</DialogContent>
```

---

## 🔔 **Notification Integration**

### **Viewing Request Notifications**

```typescript
// After successful viewing request
const onSuccess = (viewingRequest) => {
  // Show success toast
  toast.success('Viewing request submitted!')
  
  // Send notification to landlord
  notificationsAPI.send({
    user_id: property.landlord_id,
    type: 'viewing_request',
    title: 'New Viewing Request',
    message: `${user.first_name} wants to view ${property.title}`,
    data: {
      viewing_request_id: viewingRequest.id,
      property_id: property.id
    }
  })
}
```

### **Application Notifications**

```typescript
// After successful application
const onSuccess = (application) => {
  toast.success('Application submitted successfully!')
  
  // Send notification to landlord
  notificationsAPI.send({
    user_id: property.landlord_id,
    type: 'new_application',
    title: 'New Rental Application',
    message: `${user.first_name} applied for ${property.title}`,
    data: {
      application_id: application.id,
      property_id: property.id
    }
  })
}
```

---

## 📊 **Analytics Integration**

### **Track Conversion Events**

```typescript
// Track viewing request
analytics.track('viewing_request_submitted', {
  property_id: property.id,
  property_title: property.title,
  user_id: user.id,
  price: property.price,
  location: property.location
})

// Track application submission
analytics.track('application_submitted', {
  property_id: property.id,
  application_id: application.id,
  user_id: user.id,
  viewing_completed: hasViewed
})
```

---

## 🎯 **Progressive Enhancement**

### **Smart Action Buttons**

```typescript
const getActionButton = () => {
  if (!user) {
    return {
      text: 'Sign Up to Apply',
      action: () => router.push('/signin'),
      variant: 'outline'
    }
  }
  
  if (!hasViewed) {
    return {
      text: 'Schedule Viewing First',
      action: () => setShowViewingModal(true),
      variant: 'default'
    }
  }
  
  if (!hasApplied) {
    return {
      text: 'Apply Now',
      action: () => setShowApplicationModal(true),
      variant: 'default'
    }
  }
  
  return {
    text: 'View Application Status',
    action: () => router.push('/dashboard/applications'),
    variant: 'outline'
  }
}
```

---

## 🚀 **Implementation Checklist**

### **✅ Required Components**
- [ ] `ViewingRequestModal.tsx` - ✅ Created
- [ ] `ApplicationForm.tsx` - ✅ Created  
- [ ] `viewing-requests.ts` API - ✅ Created
- [ ] `applications.ts` API - ✅ Exists

### **🔄 Integration Steps**
- [ ] Update `PropertyCard.tsx` with action buttons
- [ ] Update property detail page with progressive actions
- [ ] Add viewing request status checking
- [ ] Add application status checking
- [ ] Implement notification system
- [ ] Add analytics tracking

### **📱 Mobile Optimization**
- [ ] Responsive modal designs
- [ ] Mobile-optimized action buttons
- [ ] Touch-friendly interfaces

### **🔔 User Experience**
- [ ] Progressive action flow
- [ ] Clear status indicators
- [ ] Success/error notifications
- [ ] Loading states

---

## 🎉 **Result**

After integration, users will experience:

1. **Browse Properties** → Find interesting properties
2. **Schedule Viewing** → Book property viewings
3. **Submit Application** → Apply for desired properties  
4. **Track Progress** → Monitor application status
5. **Sign Agreement** → Complete rental process
6. **Move In** → Start renting

This creates a **complete, seamless rental experience** from discovery to move-in! 🏠✨
