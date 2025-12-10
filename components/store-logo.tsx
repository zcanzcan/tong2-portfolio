import React from 'react'
import { ShoppingCart } from 'lucide-react'

type StoreName = 'kyobo' | 'yes24' | 'aladin' | 'ridi' | 'generic'

interface StoreLogoProps {
    store: string
    className?: string
}

export const StoreLogo = ({ store, className }: StoreLogoProps) => {
    const normalizeStore = (name: string): StoreName => {
        // Normalize to NFC to handle Korean characters correctly on all platforms
        const normalized = name ? name.normalize('NFC') : ''
        const lower = normalized.toLowerCase().replace(/\s/g, '')

        // Check for Korean names
        if (lower.includes('kyobo') || lower.includes('교보')) return 'kyobo'
        if (lower.includes('yes') || lower.includes('예스')) return 'yes24' // Matches 'yes24', 'yes', 'Yes24'
        if (lower.includes('aladin') || lower.includes('알라딘')) return 'aladin'
        if (lower.includes('ridi') || lower.includes('리디')) return 'ridi'

        return 'generic'
    }

    const type = normalizeStore(store)

    switch (type) {
        case 'kyobo':
            return (
                <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Kyobo: Official Green Theme. Symbol: Person reading under tree (approximated) + Text */}
                    <rect width="100" height="100" rx="20" fill="#4B6248" />
                    {/* Stylized 'Tree' and 'Person' abstract shape */}
                    <path d="M50 20C55 20 60 25 60 35C60 45 50 45 50 45C50 45 40 45 40 35C40 25 45 20 50 20Z" fill="white" />
                    <path d="M50 48C65 48 70 60 70 70H30C30 60 35 48 50 48Z" fill="white" />
                    {/* 'KYOBO' Text below or integrated */}
                    <text x="50" y="85" fontSize="14" fontFamily="sans-serif" fontWeight="bold" fill="white" textAnchor="middle">KYOBO</text>
                </svg>
            )
        case 'yes24':
            return (
                <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Yes24: Blue Theme. "YES24" text with swoosh */}
                    <rect width="100" height="100" rx="20" fill="#18427C" />
                    <text x="50" y="55" fontSize="24" fontFamily="Arial, sans-serif" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="-1">YES24</text>
                    {/* Smiley Swoosh */}
                    <path d="M30 65 Q50 80 70 65" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <circle cx="72" cy="63" r="3" fill="white" />
                </svg>
            )
        case 'aladin':
            return (
                <svg viewBox="0 0 135 135" className={className} xmlns="http://www.w3.org/2000/svg">
                    {/* Aladin: Pink Theme. Official Lamp Path found from search */}
                    <rect width="135" height="135" rx="20" fill="#EB5375" />
                    <g transform="translate(15, 15) scale(0.8)">
                        <path fill="white" d="M34.939 90.003L12.569 65.718 0 52.908 42.66 52.908 67.579 27.989 92.499 52.908 135.159 52.908 122.59 65.718 100.219 90.003 76.719 90.003 67.579 80.863 58.438 90.003 34.939 90.003Z" />
                        <text x="67" y="115" fontSize="20" fontFamily="sans-serif" fontWeight="bold" fill="white" textAnchor="middle">aladin</text>
                    </g>
                </svg>
            )
        case 'ridi':
            return (
                <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Ridi: Ridibooks Blue. Simply "RIDI" in bold sans-serif */}
                    <rect width="100" height="100" rx="20" fill="#0077D9" />
                    <text x="50" y="60" fontSize="32" fontFamily="Arial, sans-serif" fontWeight="900" fill="white" textAnchor="middle">RIDI</text>
                </svg>
            )
        default:
            return <ShoppingCart className={className} />
    }
}

export const getStoreColor = (store: string) => {
    const normalized = store ? store.normalize('NFC') : ''
    const lower = normalized.toLowerCase().replace(/\s/g, '')

    if (lower.includes('kyobo') || lower.includes('교보')) return 'bg-[#4B6248]'
    if (lower.includes('yes') || lower.includes('예스')) return 'bg-[#18427C]'
    if (lower.includes('aladin') || lower.includes('알라딘')) return 'bg-[#EB5375]'
    if (lower.includes('ridi') || lower.includes('리디')) return 'bg-[#0077D9]'
    return 'bg-amber-500' // Default fallback
}
