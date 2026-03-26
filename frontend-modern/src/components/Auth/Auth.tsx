import React, { useState } from 'react';
import { Input } from '../../../.gemini/skills/components/Input';
import { Button } from '../../../.gemini/skills/components/Button';
import { AUTH_COPY } from '../../data/mockData';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-center overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed relative">
      
      {/* Subtle background texture element (Mesh Gradient) */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-primary-container/5 blur-[120px]"></div>
        <div className="absolute right-0 top-0 w-[400px] h-[400px] rounded-full bg-secondary-container/10 blur-[100px]"></div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-24 flex items-center justify-center relative">
        
        {/* Authentication Card */}
        <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-xl p-8 sm:p-12 shadow-ambient-glow relative z-10 transition-all">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl font-extrabold text-on-surface tracking-tight mb-3">
              {isLogin ? AUTH_COPY.loginTitle : AUTH_COPY.registerTitle}
            </h1>
            <p className="text-on-surface-variant font-body leading-relaxed max-w-xs mx-auto text-sm">
              {isLogin ? AUTH_COPY.loginSubtitle : AUTH_COPY.registerSubtitle}
            </p>
          </div>

          {/* Form Area */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <Input label="Full Name" type="text" placeholder="John Doe" icon="person" />
            )}

            <Input label="Email Address" type="email" placeholder="name@company.com" icon="mail" />

            <div className="space-y-2 relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon="lock"
              />
              <button
                type="button"
                className="absolute right-4 top-[38px] flex items-center justify-center text-outline hover:text-on-surface"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Remember Me & Extra */}
            {isLogin ? (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-highest transition-all"
                  />
                  <span className="ml-3 text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Keep me signed in
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-start pt-2">
                <label className="flex items-start cursor-pointer group mt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-highest transition-all"
                  />
                  <span className="ml-3 text-sm text-on-surface-variant transition-colors group-hover:text-on-surface">
                    I agree to the{' '}
                    <a href="#" className="font-semibold text-primary hover:text-primary-container underline-offset-4 hover:underline">
                      Terms
                    </a>
                  </span>
                </label>
              </div>
            )}

            {/* Primary Action */}
            <div className="pt-4">
              <Button variant="primary" fullWidth icon="arrow_forward">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          </form>

          {/* Footer Navigation */}
          <div className="mt-12 flex flex-col items-center gap-4 w-full font-body text-sm tracking-wide bg-transparent">
            {isLogin && (
              <div className="flex items-center gap-4">
                <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-medium">
                  Forgot Password
                </a>
                <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></div>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="font-semibold text-primary underline-offset-4 underline hover:text-primary-container transition-colors"
                >
                  Create Account
                </button>
              </div>
            )}
            {!isLogin && (
              <div className="flex items-center gap-4">
                <span className="text-on-surface-variant">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="font-semibold text-primary underline-offset-4 underline hover:text-primary-container transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
            <p className="text-on-surface-variant/60 text-xs mt-2">
              {AUTH_COPY.copyright}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
