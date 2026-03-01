'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PortfolioData {
    config?: any;
    profile?: any;
    heroButtons?: any[];
    experience?: any[];
    frontendSkills?: any[];
    backendSkills?: any[];
    otherSkills?: any[];
    skills?: any[];
    certifications?: any[];
    projects?: any[];
    socials?: any[];
    learningData?: any;
    publications?: any[];
    calendar?: any;
    blog?: any;
}

interface PortfolioDataContextType {
    data: PortfolioData | null;
    isLoading: boolean;
    error: Error | null;
}

const PortfolioDataContext = createContext<PortfolioDataContextType | undefined>(undefined);

interface ProviderProps {
    children: ReactNode;
    initialData?: PortfolioData | null;
}

export function PortfolioDataProvider({ children, initialData = null }: ProviderProps) {
    // initialData가 있으면 즉시 사용, 없으면 client fetch fallback
    const [data, setData] = useState<PortfolioData | null>(initialData);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState<Error | null>(null);

    // initialData가 없는 경우에만 client-side fetch (fallback)
    useEffect(() => {
        if (initialData) return; // 서버에서 데이터가 왔으면 fetch 불필요

        fetch('/api/portfolio')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch portfolio data');
                return res.json();
            })
            .then(fetchedData => {
                setData(fetchedData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching portfolio data:', err);
                setError(err);
                setIsLoading(false);
            });
    }, [initialData]);

    return (
        <PortfolioDataContext.Provider value={{ data, isLoading, error }}>
            {children}
        </PortfolioDataContext.Provider>
    );
}

export function usePortfolioData() {
    const context = useContext(PortfolioDataContext);
    if (context === undefined) {
        throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
    }
    return context;
}
