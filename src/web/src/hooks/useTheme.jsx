import { createContext, useContext, useState, useEffect } from 'react';
import { settings as settingsApi } from '../utils/api';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load theme from localStorage first (for instant load)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        }
        setLoading(false);
    }, []);

    const applyTheme = (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Try to save to server (if logged in)
        try {
            await settingsApi.update({ theme: newTheme });
        } catch (e) {
            // Ignore if not logged in
        }
    };

    const loadUserTheme = async () => {
        try {
            const res = await settingsApi.get();
            if (res.settings?.theme) {
                setTheme(res.settings.theme);
                applyTheme(res.settings.theme);
                localStorage.setItem('theme', res.settings.theme);
            }
        } catch (e) {
            // Use local theme
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, loadUserTheme, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
