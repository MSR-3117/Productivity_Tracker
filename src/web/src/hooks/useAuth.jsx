import { useState, useEffect, createContext, useContext } from 'react';
import { auth } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (from localStorage)
        const userId = localStorage.getItem('userId');
        if (userId) {
            setUser({ id: parseInt(userId) });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await auth.login(email, password);
        localStorage.setItem('userId', response.userId);
        setUser({ id: response.userId });
        return response;
    };

    const register = async (email, password) => {
        const response = await auth.register(email, password);
        localStorage.setItem('userId', response.userId);
        setUser({ id: response.userId });
        return response;
    };

    const logout = async () => {
        await auth.logout();
        localStorage.removeItem('userId');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
