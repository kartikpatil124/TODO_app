import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Terms of Service</h1>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none space-y-6">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Smart Todo App, you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              Smart Todo App provides users with access to a rich collection of resources, including various productivity tools 
              such as task management, habit tracking, and calendar scheduling ("the Service"). You understand and agree that the 
              Service is provided "AS-IS" and that Smart Todo App assumes no responsibility for the timeliness, deletion, mis-delivery, 
              or failure to store any user communications or personalization settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. User Responsibilities</h2>
            <p>
              You agree to use the Service only for purposes that are permitted by (a) the Terms and (b) any applicable law, regulation 
              or generally accepted practices or guidelines in the relevant jurisdictions.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-400">
              <li>You must maintain the confidentiality of your Google account credentials connected to our service.</li>
              <li>You must not use the Service for any illegal or unauthorized purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Liability Disclaimer</h2>
            <p>
              The information, software, products, and services included in or available through Smart Todo App may include 
              inaccuracies or typographical errors. Changes are periodically added to the information herein. Smart Todo App 
              and/or its suppliers may make improvements and/or changes in the application at any time.
            </p>
            <p className="mt-4 uppercase text-sm font-semibold text-slate-500">
              Smart Todo App makes no representations about the suitability, reliability, availability, timeliness, and accuracy 
              of the service for any purpose. To the maximum extent permitted by applicable law, all such information, software, 
              products, services are provided "as is" without warranty or condition of any kind.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
