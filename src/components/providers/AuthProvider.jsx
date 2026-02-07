"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    refreshUser: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = api.getToken();
            if (token) {
                const response = await api.getCurrentUser();
                if (response.success) {
                    setUser(response.data);
                } else {
                    api.removeToken();
                }
            }
        } catch (err) {
            api.removeToken();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.login(email, password);
        if (response.success && response.data?.user) {
            setUser(response.data.user);
            return response.data.user;
        }
        throw new Error(response.error || "Login failed");
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const response = await api.getCurrentUser();
            if (response.success) {
                setUser(response.data);
            }
        } catch (err) {
            console.error("Failed to refresh user:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}
