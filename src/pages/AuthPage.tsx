import React, { useState } from 'react';
import { 
    auth, 
    googleProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from '../services/firebase';
import { SpinnerIcon } from '../components/icons/SpinnerIcon';
import { ErrorIcon } from '../components/icons/ErrorIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';
import { GoogleIcon } from '../components/icons/GoogleIcon';
// FIX: The FirebaseError type is not consistently exported from 'firebase/app' in all SDK versions.
// Defining a minimal interface here ensures type safety for caught errors without a breaking import.
interface FirebaseError extends Error {
    code: string;
}

type AuthMode = 'signin' | 'signup';

interface AuthPageProps {
    onGuestLogin: () => void;
    appError: string | null;
    setAppError: (error: string | null) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onGuestLogin, appError, setAppError }) => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const clearErrors = () => {
        setFormError(null);
        setAppError(null);
    };
    
    const handleAuthError = (err: FirebaseError) => {
        const errorCode = err.code;
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/popup-closed-by-user':
                return 'The sign-in popup was closed. Please try again.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with this email address. Please sign in with the original method.';
            case 'auth/invalid-api-key':
                return 'Firebase configuration error: The API key is invalid. Please check your Firebase configuration in services/firebase.ts.';
            default:
                return `An unexpected error occurred. Please try again. (Code: ${errorCode})`;
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        clearErrors();
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err) {
            setFormError(handleAuthError(err as FirebaseError));
        } finally {
            setIsGoogleLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        clearErrors();

        try {
            if (mode === 'signup') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setFormError(handleAuthError(err as FirebaseError));
        } finally {
            setIsLoading(false);
        }
    };

    const displayedError = appError || formError;

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 backdrop-blur-xl">
                <div className="flex border-b border-brand-lavender/20 mb-6">
                    <button
                        onClick={() => { setMode('signin'); clearErrors(); }}
                        className={`w-1/2 py-3 font-semibold text-center transition-colors ${mode === 'signin' ? 'text-white border-b-2 border-brand-lavender' : 'text-white/60 hover:text-white'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => { setMode('signup'); clearErrors(); }}
                        className={`w-1/2 py-3 font-semibold text-center transition-colors ${mode === 'signup' ? 'text-white border-b-2 border-brand-lavender' : 'text-white/60 hover:text-white'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-1">{mode === 'signin' ? 'Welcome Back' : 'Create an Account'}</h2>
                <p className="text-white/60 text-center mb-6">
                    {mode === 'signin'
                        ? 'Sign in to access your practice history.'
                        : 'Sign up to save your progress and access all features.'
                    }
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                            required
                            className="w-full bg-black/20 border border-brand-lavender/30 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lavender"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-white/80 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                                required
                                minLength={6}
                                className="w-full bg-black/20 border border-brand-lavender/30 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lavender pr-10"
                                placeholder="••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(prev => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 hover:text-white"
                                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                                {isPasswordVisible ? (
                                    <EyeOffIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {displayedError && (
                        <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center space-x-2 text-sm">
                            <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                            <span>{displayedError}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                           <>
                            <SpinnerIcon className="w-5 h-5"/>
                            <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                           </>
                        ) : (
                            <span>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                        )}
                    </button>
                </form>
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-brand-lavender/20"></div>
                    <span className="flex-shrink mx-4 text-white/50 text-sm">OR</span>
                    <div className="flex-grow border-t border-brand-lavender/20"></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isGoogleLoading}
                    className="w-full bg-white/5 text-white font-bold py-3 px-4 rounded-lg hover:bg-white/10 disabled:bg-white/5 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo flex items-center justify-center space-x-3"
                >
                     {isGoogleLoading ? (
                        <>
                            <SpinnerIcon className="w-5 h-5" />
                            <span>{mode === 'signin' ? 'Signing In...' : 'Signing Up...'}</span>
                        </>
                    ) : (
                        <>
                            <GoogleIcon className="w-5 h-5" />
                            <span>{mode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}</span>
                        </>
                    )}
                </button>

                <div className="text-center mt-6">
                    <button
                        onClick={onGuestLogin}
                        className="text-brand-lavender hover:text-purple-300 font-semibold text-sm transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
