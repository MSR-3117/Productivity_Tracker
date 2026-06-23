import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { auth } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check auth status on mount — uses refresh token cookie to get user
    useEffect(() => {
        // Intercept OAuth token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
            window.__accessToken = token;
            // Clean up the URL so the token isn't visible in the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await auth.me();
            setUser(response.user);
        } catch (err) {
            // Not authenticated — that's fine
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await auth.login(email, password);
        // Store access token in memory (not localStorage)
        if (response.accessToken) {
            window.__accessToken = response.accessToken;
        }
        setUser(response.user);
        return response;
    };

    const register = async (email, password) => {
        const response = await auth.register(email, password);
        if (response.accessToken) {
            window.__accessToken = response.accessToken;
        }
        setUser(response.user);
        return response;
    };

    const logout = useCallback(async () => {
        try {
            await auth.logout();
        } catch (e) {
            // Ignore errors during logout
        }
        window.__accessToken = null;
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
