export default function WelcomeEmailDesign() {
  return (
    <div className="w-full bg-gradient-to-br from-green-50 to-white min-h-screen p-4">
      {/* Email Preview Container */}
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with Brand */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">AFÁRÁ</h1>
          <p className="text-green-100 text-lg">Women Leading Africa's Energy & Infrastructure Future</p>
        </div>

        {/* Main Content */}
        <div className="px-8 py-10">
          {/* Greeting */}
          <p className="text-sm text-gray-600 mb-6">Dear Community Member,</p>

          {/* Main Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Welcome to AFÁRÁ!</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Thank you for subscribing to our community. You're now part of a vibrant network of women infrapreneurs and leaders transforming Africa's energy and infrastructure landscape.
            </p>
          </div>

          {/* What They'll Receive */}
          <div className="mb-8 bg-green-50 border-l-4 border-green-600 p-6 rounded">
            <h3 className="font-bold text-green-700 mb-4">As a member, you'll receive:</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Program Updates</strong> – Latest news on our accelerator cohorts and initiatives</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Success Stories</strong> – Inspiring journeys from our alumni infrapreneurs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Industry Insights</strong> – Expert perspectives on energy and infrastructure trends</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Exclusive Events</strong> – Networking sessions, webinars, and workshops</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Resource Library</strong> – Templates, guides, and tools to support your journey</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="mb-8 text-center">
            <a 
              href="#"
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Explore AFÁRÁ →
            </a>
          </div>

          {/* Next Steps */}
          <div className="mb-8 bg-blue-50 border border-blue-200 p-6 rounded">
            <h3 className="font-bold text-blue-900 mb-3">Next Steps:</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex">
                <span className="text-blue-600 font-bold mr-3">1.</span>
                Keep an eye on your inbox for our first newsletter
              </li>
              <li className="flex">
                <span className="text-blue-600 font-bold mr-3">2.</span>
                Connect with us on social media for daily updates
              </li>
              <li className="flex">
                <span className="text-blue-600 font-bold mr-3">3.</span>
                Join upcoming events and network with fellow leaders
              </li>
            </ol>
          </div>

          {/* Closing */}
          <div className="mb-8 text-gray-700">
            <p className="mb-4">We're excited to have you in the AFÁRÁ community. If you have any questions or need assistance, our team is here to help.</p>
            <p className="mb-4">
              <strong>Contact us:</strong> <a href="mailto:info@afaraaccelerator.org" className="text-green-600 hover:underline">info@afaraaccelerator.org</a>
            </p>
            <p className="mb-2">Best regards,</p>
            <p className="font-bold text-green-700">The AFÁRÁ Team</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-6 border-t">
          <p className="text-xs text-gray-600 text-center mb-2">
            AFÁRÁ is an initiative of <strong>Open Spaces & Bridges Advisory (OPSB)</strong>
          </p>
          <p className="text-xs text-gray-500 text-center">
            © 2026 AFÁRÁ. All rights reserved. | Building Africa's energy and infrastructure future
          </p>
        </div>
      </div>

      {/* Design Notes */}
      <div className="max-w-2xl mx-auto mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-gray-700">
        <p className="font-semibold mb-2">Design Features:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Professional gradient header with AFÁRÁ branding</li>
          <li>Clear visual hierarchy with green accent color (brand color)</li>
          <li>Benefits highlighted in easy-to-scan format</li>
          <li>Prominent call-to-action button</li>
          <li>Next steps guide for new members</li>
          <li>Professional footer with brand attribution</li>
        </ul>
      </div>
    </div>
  );
}
