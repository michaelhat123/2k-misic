"use client"

import { motion } from "framer-motion"
import { Shield } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function PrivacyPage() {
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
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
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
            <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
            <p className="leading-relaxed">
              At 2K Music, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our music streaming application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Personal Information</h3>
                <p className="leading-relaxed">
                  When you create an account, we collect information such as your name, email address, and password. This information is necessary to provide you with our services and personalize your experience.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Usage Data</h3>
                <p className="leading-relaxed">
                  We collect information about your interactions with our service, including songs played, playlists created, search queries, and listening history. This helps us improve our recommendations and service quality.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary mb-2">Device Information</h3>
                <p className="leading-relaxed">
                  We may collect information about the device you use to access 2K Music, including device type, operating system, IP address, and browser type.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your music recommendations and experience</li>
              <li>Process your transactions and manage your account</li>
              <li>Send you updates, newsletters, and promotional materials (with your consent)</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Sharing and Disclosure</h2>
            <p className="leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>With your consent:</strong> When you explicitly authorize us to share specific information</li>
              <li><strong>Service providers:</strong> With trusted third-party vendors who assist us in operating our service</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights and users' safety</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Your Rights and Choices</h2>
            <p className="leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Delete your account and personal information</li>
              <li>Opt-out of promotional communications</li>
              <li>Manage your privacy settings within the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking Technologies</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
            <p className="leading-relaxed">
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 p-4 glass rounded-lg">
              <p className="text-primary font-semibold">Email: privacy@2kmusic.com</p>
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
