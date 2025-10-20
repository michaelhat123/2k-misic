"use client"

import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function TermsPage() {
  return (
    <ScrollArea className="h-full group relative z-0">
    <div className="pt-16 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8 md:p-12 space-y-8 text-gray-300"
        >
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using 2K Music, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">License to Use</h2>
            <p className="leading-relaxed mb-4">
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable license to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Stream music from our catalog for personal, non-commercial use</li>
              <li>Create and manage playlists</li>
              <li>Download songs for offline listening (Premium users only)</li>
              <li>Share playlists with other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Account Creation</h3>
                <p className="leading-relaxed">
                  You must create an account to use 2K Music. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Account Security</h3>
                <p className="leading-relaxed">
                  You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your account information.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Prohibited Conduct</h2>
            <p className="leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Use the service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to circumvent any content protection measures</li>
              <li>Share your account credentials with others</li>
              <li>Upload, post, or transmit any harmful, offensive, or inappropriate content</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the service</li>
              <li>Remove or modify any copyright, trademark, or other proprietary notices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
            <p className="leading-relaxed">
              All content available through 2K Music, including but not limited to music, artwork, text, graphics, logos, and software, is protected by copyright, trademark, and other intellectual property laws. The music catalog is licensed from rights holders and may not be reproduced, distributed, or used commercially without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Subscription and Payment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Free and Premium Plans</h3>
                <p className="leading-relaxed">
                  2K Music offers both free (ad-supported) and premium (subscription-based) plans. Premium features include ad-free listening, offline downloads, and high-quality audio.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Billing</h3>
                <p className="leading-relaxed">
                  Premium subscriptions are billed on a recurring basis. You authorize us to charge your payment method for all fees incurred. Subscriptions automatically renew unless cancelled before the renewal date.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Cancellation and Refunds</h3>
                <p className="leading-relaxed">
                  You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. We do not provide refunds for partial months or unused portions of your subscription.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Content Availability</h2>
            <p className="leading-relaxed">
              The availability of specific songs, albums, or artists may vary by region and may change over time due to licensing agreements. We do not guarantee that any particular content will remain available.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              The service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, 2K Music shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or related to your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
            <p className="leading-relaxed">
              We may modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on our website. Your continued use of the service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 2K Music operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 glass rounded-lg">
              <p className="text-primary font-semibold">Email: legal@2kmusic.com</p>
              <p className="text-gray-400">Support: support@2kmusic.com</p>
            </div>
          </section>
        </motion.div>
      </div>
      <div className="mb-20"></div>
      <Footer />
    </div>
    </ScrollArea>
  )
}
