import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none space-y-6">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to Nexus OS. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. The Data We Collect About You</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-400">
              <li><strong>Identity Data:</strong> includes first name, last name, and username (provided by Google via OAuth).</li>
              <li><strong>Contact Data:</strong> includes email address.</li>
              <li><strong>User Generated Content:</strong> tasks, notes, habits, and order information you explicitly store within the application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. How We Use Your Personal Data</h2>
            <p>We will only use your personal data for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-400">
              <li>To provide authentication and manage your session using Google OAuth.</li>
              <li>To store and manage your tasks, schedules, and app preferences.</li>
              <li>To improve our application and website UX.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Data Protection and No-Sell Policy</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
            </p>
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mt-4 text-indigo-200">
              <strong>Strict No-Sell Policy:</strong> Nexus OS does NOT sell, rent, or lease any of your personal data or user-generated content to third parties under any circumstances.
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at: <br/>
              <strong className="text-white">support@nexusos.app</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
