"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#061218] text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-b from-[#063d3d] to-[#0a6f6f] flex items-center justify-center">
            <Search size={32} className="text-[#5de0e0]" />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-[#5e8c96] mb-4">
            Page Not Found
          </h2>
          <p className="text-[#7aacb5] text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00d1c1] text-[#020c0c] rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Home size={18} />
            Go Home
          </Link>

          <div className="pt-2">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2 text-[#5e8c96] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}