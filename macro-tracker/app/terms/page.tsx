import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>

        {/* Page title */}
        <h1 className="text-4xl font-bold mt-8 mb-6">Terms of Service</h1>

        {/* Content card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using Siphio, you accept and agree to be bound by
              the terms and provisions of this agreement.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to use Siphio for personal, non-commercial
              nutrition tracking purposes. This license shall automatically terminate
              if you violate any of these restrictions.
            </p>

            <h2>Account Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Complying with applicable laws and regulations</li>
            </ul>

            <h2>Prohibited Uses</h2>
            <p>You may not use Siphio to:</p>
            <ul>
              <li>Violate any laws or regulations</li>
              <li>Infringe upon others' intellectual property rights</li>
              <li>Transmit harmful code or malware</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2>Disclaimer</h2>
            <p>
              Siphio is provided "as is" without warranty of any kind. We do not
              guarantee that the service will be uninterrupted, secure, or error-free.
              Nutrition information is for informational purposes only and should not
              replace professional medical advice.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              Siphio shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of or
              inability to use the service.
            </p>

            <h2>Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at our
              discretion, without notice, for conduct that we believe violates
              these Terms of Service or is harmful to other users.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to support@siphio.app
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
