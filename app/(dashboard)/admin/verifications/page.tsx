"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface VerificationRequest {
  id: string;
  email: string;
  full_name: string;
  user_type: 'tenant' | 'landlord';
  verification_status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  location?: string;
  trust_score?: number;
  nin?: string;
  bvn?: string;
  id_document?: string;
  selfie_photo?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchVerifications();
    }
  }, [filter, mounted]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      
      // Fetch both tenant and landlord verifications
      const [tenantResponse, landlordResponse] = await Promise.all([
        fetch(`/api/v1/admin/tenant-verifications${filter !== 'all' ? `?status=${filter}` : ''}`),
        fetch(`/api/v1/admin/landlord-verifications${filter !== 'all' ? `?status=${filter}` : ''}`)
      ]);

      const tenantData = await tenantResponse.json();
      const landlordData = await landlordResponse.json();

      const allVerifications = [
        ...(tenantData.verifications || []),
        ...(landlordData.verifications || [])
      ];

      setVerifications(allVerifications);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, userType: 'tenant' | 'landlord') => {
    try {
      setProcessing(userId);
      const endpoint = userType === 'landlord' 
        ? `/api/v1/admin/landlord-verifications/${userId}/approve`
        : `/api/v1/admin/tenant-verifications/${userId}/approve`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast.success('Verification approved successfully');
        fetchVerifications();
      } else {
        throw new Error('Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string, userType: 'tenant' | 'landlord', reason: string) => {
    try {
      setProcessing(userId);
      const endpoint = userType === 'landlord' 
        ? `/api/v1/admin/landlord-verifications/${userId}/reject`
        : `/api/v1/admin/tenant-verifications/${userId}/reject`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success('Verification rejected successfully');
        fetchVerifications();
      } else {
        throw new Error('Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Verifications</h1>
        
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {verifications.map((verification) => (
          <Card key={verification.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{verification.full_name}</CardTitle>
                  <p className="text-sm text-gray-600">{verification.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{verification.user_type}</p>
                </div>
                {getStatusBadge(verification.verification_status)}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{verification.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{verification.location || 'N/A'}</p>
                </div>
                {verification.trust_score !== undefined && (
                  <div>
                    <Label className="text-sm font-medium">Trust Score</Label>
                    <p className="text-sm">{verification.trust_score}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Applied</Label>
                  <p className="text-sm">
                    {new Date(verification.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {verification.user_type === 'landlord' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {verification.nin && (
                    <div>
                      <Label className="text-sm font-medium">NIN</Label>
                      <p className="text-sm">{verification.nin}</p>
                    </div>
                  )}
                  {verification.bvn && (
                    <div>
                      <Label className="text-sm font-medium">BVN</Label>
                      <p className="text-sm">{verification.bvn}</p>
                    </div>
                  )}
                  {verification.company_name && (
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm">{verification.company_name}</p>
                    </div>
                  )}
                </div>
              )}

              {verification.verification_status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(verification.id, verification.user_type)}
                    disabled={processing === verification.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === verification.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Approve
                  </Button>
                  
                  <RejectButton
                    onReject={(reason) => handleReject(verification.id, verification.user_type, reason)}
                    disabled={processing === verification.id}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {verifications.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No {filter} verifications found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RejectButton({ onReject, disabled }: { onReject: (reason: string) => void; disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onReject(reason);
      setIsOpen(false);
      setReason('');
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        Reject
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for rejection..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleSubmit}
                    disabled={!reason.trim()}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
