import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mt-8 mb-6">Privacy Policy</h1>

        {/* Content card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              Siphio ("we", "our", or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our macro tracking application.
            </p>

            <h2>Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account information (email, name)</li>
              <li>Nutrition data (meals, macros, goals)</li>
              <li>Usage data (app interactions, preferences)</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience</li>
              <li>Send you updates and notifications</li>
              <li>Protect against fraud and abuse</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data,
              including encryption, secure authentication, and regular security audits.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Export your data (via Settings)</li>
              <li>Delete your account and data</li>
              <li>Opt-out of communications</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at
              privacy@siphio.app
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
