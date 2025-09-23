'use client';

import React, { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, FileText } from 'lucide-react';

export default function TestConfirmationModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock document ID - you can replace with a real document ID from your database
  const mockDocumentId = "test-doc-123";

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsModalOpen(false);
      alert('Content generation started! (This is just a demo)');
    }, 3000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">ConfirmationModal Test Page</h1>
          <p className="text-muted-foreground">
            Test the modernized ConfirmationModal component with shadcn UI and orange theme
          </p>
        </div>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              How to Test
            </CardTitle>
            <CardDescription>
              Click the button below to open the ConfirmationModal and test its features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Visual Elements to Check:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Orange theme integration</li>
                  <li>Document info card with stats</li>
                  <li>Content preview section</li>
                  <li>Platform icons (Blog, LinkedIn, Twitter, Podcast)</li>
                  <li>Warning alert with orange styling</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Interactive Elements to Test:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Modal open/close functionality</li>
                  <li>Cancel button behavior</li>
                  <li>Generate button with loading state</li>
                  <li>Responsive design (try mobile view)</li>
                  <li>Scrollable content area</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Button */}
        <div className="text-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="flex items-center gap-2"
          >
            <Zap className="h-5 w-5" />
            Open ConfirmationModal
          </Button>
        </div>

        {/* Note about mock data */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> This test page uses a mock document ID. The modal will show loading state 
              initially and may display an error if the document does not exist in your database. 
              This is normal for testing purposes and demonstrates the error handling UI.
            </p>
          </CardContent>
        </Card>

        {/* ConfirmationModal */}
        <ConfirmationModal
          documentId={mockDocumentId}
          isOpen={isModalOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}
