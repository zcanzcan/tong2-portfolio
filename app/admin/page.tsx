'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Save, Plus, Trash2, Edit2, User, Briefcase,
    Code, Folder, BookOpen, Book, ExternalLink,
    Layout, Image as ImageIcon, Link as LinkIcon, ShoppingCart,
    LogOut, Upload, X, Home, Share2, Calendar as CalendarIcon, Eye, ChevronDown, Award, Terminal, AlertCircle
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StoreLogo, getStoreColor } from '@/components/store-logo'
import { SpotlightCard } from '@/components/spotlight-card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'

export default function AdminPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('profile')
    const [isLoading, setIsLoading] = useState(true)

    // Data States
    const [profile, setProfile] = useState<any>(null)
    const [heroButtons, setHeroButtons] = useState<any[]>([])
    const [experience, setExperience] = useState<any[]>([])
    const [skills, setSkills] = useState<any[]>([])
    const [certifications, setCertifications] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [blog, setBlog] = useState<any>(null)
    const [publications, setPublications] = useState<any[]>([])
    const [socials, setSocials] = useState<any[]>([])
    const [calendar, setCalendar] = useState<any>({})
    const [newEvent, setNewEvent] = useState<any>({
        summary: '',
        description: '',
        startDate: null as Date | null,
        startTime: { hour: '09', minute: '00' },
        endDate: null as Date | null,
        endTime: { hour: '10', minute: '00' },
        location: ''
    })

    // Edit States
    const [editingProject, setEditingProject] = useState<any>(null)
    const [editingProjectIndex, setEditingProjectIndex] = useState(-1)
    const [editingPublicationIndex, setEditingPublicationIndex] = useState(0)
    const [previewPublication, setPreviewPublication] = useState<any>(null)

    // Upload States
    const [uploading, setUploading] = useState<string | null>(null) // 'profile' | 'project' | 'publication' | 'resume'
    const [uploadingResume, setUploadingResume] = useState(false)

    // Error Log Console States
    const [showErrorConsole, setShowErrorConsole] = useState(false)
    const [errorLogs, setErrorLogs] = useState<Array<{ timestamp: string; message: string; details?: string }>>([])

    useEffect(() => {
        fetchAllData()

        // URL 파라미터에서 성공/실패 메시지 확인
        const params = new URLSearchParams(window.location.search)
        const success = params.get('success')
        const error = params.get('error')
        const message = params.get('message')

        if (success === 'calendar_connected') {
            alert('✅ Google Calendar 연결이 완료되었습니다! 토큰이 자동으로 저장되었습니다.')
            // URL에서 파라미터 제거
            window.history.replaceState({}, '', window.location.pathname + '?tab=calendar')
        } else if (error) {
            const errorMessage = message || '오류가 발생했습니다.'
            const details = params.get('details') || ''
            const stack = params.get('stack') || ''

            // 에러 로그에 추가
            setErrorLogs(prev => [{
                timestamp: new Date().toLocaleString('ko-KR'),
                message: errorMessage,
                details: details || stack || undefined
            }, ...prev])

            // 콘솔 자동 열기
            setShowErrorConsole(true)

            alert(`❌ ${errorMessage}${details ? '\n\n상세 정보는 에러 콘솔을 확인하세요.' : ''}`)
            // URL에서 파라미터 제거
            window.history.replaceState({}, '', window.location.pathname + (activeTab ? `?tab=${activeTab}` : ''))
        }
    }, [])

    // URL 파라미터 감시 및 자동 저장 (Google Calendar 토큰 등)
    useEffect(() => {
        if (!isLoading) {
            const params = new URLSearchParams(window.location.search)
            const success = params.get('success')

            if (success === 'tokens_received') {
                const accessToken = params.get('accessToken')
                const refreshToken = params.get('refreshToken')
                const clientId = params.get('clientId')
                const clientSecret = params.get('clientSecret')

                if (accessToken || refreshToken) {
                    const updatedCalendar = {
                        ...calendar,
                        oauthClientId: clientId || calendar.oauthClientId,
                        oauthClientSecret: clientSecret || calendar.oauthClientSecret,
                        accessToken: accessToken || calendar.accessToken,
                        refreshToken: refreshToken || calendar.refreshToken
                    }

                    // 캘린더 상태 업데이트
                    setCalendar(updatedCalendar)

                    // Vercel 등 읽기 전용 환경을 위해 DB에 자동 저장
                    console.log('[Admin] Auto-saving tokens received from callback')
                    handleUpdate('calendar', updatedCalendar, true).then(() => {
                        alert('✅ Google Calendar 연결이 완료되어 토큰이 자동으로 저장되었습니다!')
                    })
                }

                // 파라미터 제거하여 중복 실행 방지
                window.history.replaceState({}, '', window.location.pathname + '?tab=calendar')
            }
        }
    }, [isLoading, calendar])

    const fetchAllData = async () => {
        setIsLoading(true)
        try {
            // Fetch Portfolio Data
            const portRes = await fetch('/api/portfolio')
            if (!portRes.ok) {
                throw new Error(`포트폴리오 데이터 로딩 실패: ${portRes.status}`)
            }
            const portData = await portRes.json()

            if (portData && !portData.error) {
                setProfile(portData.profile || null)
                setHeroButtons(portData.heroButtons || [])
                setExperience(portData.experience || [])
                setSkills(portData.skills || [])
                setCertifications(portData.certifications || [])
                setBlog(portData.blog || null)
                console.log('[Admin] Loaded publications:', portData.publications)
                console.log('[Admin] First publication purchaseLinks:', portData.publications?.[0]?.purchaseLinks)
                setPublications(portData.publications || [])
                setSocials(portData.socials || [])
                console.log('[Admin] Loaded calendar data:', portData.calendar)
                setCalendar(portData.calendar || {})
            } else {
                throw new Error(portData?.error || '데이터 형식 오류')
            }

            // Fetch Projects Data
            const projRes = await fetch('/api/projects')
            if (!projRes.ok) {
                throw new Error(`프로젝트 데이터 로딩 실패: ${projRes.status}`)
            }
            const projData = await projRes.json()
            setProjects(Array.isArray(projData) ? projData : [])

        } catch (error) {
            console.error('Failed to fetch data:', error)
            alert(`데이터 로딩 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdate = async (section: string, data: any, silent: boolean = false) => {
        try {
            console.log(`[Admin] Saving ${section}:`, data)
            const res = await fetch('/api/portfolio/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, data })
            })
            const result = await res.json()
            if (res.ok) {
                console.log(`[Admin] Save successful for ${section}`)
                console.log(`[Admin] Saved data:`, JSON.stringify(data, null, 2))
                if (!silent) alert('저장되었습니다!')

                // calendar 섹션의 경우 저장 후 불러오지 않음 (현재 상태 유지)
                // 다른 섹션은 저장 후 다시 불러오기
                if (section !== 'calendar') {
                    await fetchAllData()
                }
            } else {
                console.error(`[Admin] Save failed for ${section}:`, result)
                if (!silent) alert(`저장 실패: ${result.error || '알 수 없는 오류'}`)
            }
        } catch (error) {
            console.error('Update error:', error)
            if (!silent) alert(`오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
    }

    const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (e) => {
                // 브라우저 네이티브 Image 객체 사용 (Next.js Image 컴포넌트와 충돌 방지)
                const img = document.createElement('img')
                img.src = e.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    // Resize if larger than maxWidth
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width
                        width = maxWidth
                    }

                    canvas.width = width
                    canvas.height = height

                    const ctx = canvas.getContext('2d')
                    if (!ctx) {
                        reject(new Error('Canvas context not available'))
                        return
                    }

                    ctx.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Image compression failed'))
                                return
                            }
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            })
                            resolve(compressedFile)
                        },
                        file.type,
                        quality
                    )
                }
                img.onerror = () => reject(new Error('Image load failed'))
            }
            reader.onerror = () => reject(new Error('File read failed'))
        })
    }

    const handleResumeUpload = async (file: File) => {
        setUploadingResume(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            console.log('Uploading resume file:', {
                name: file.name,
                size: file.size,
                type: file.type
            })

            const res = await fetch('/api/upload/resume', {
                method: 'POST',
                body: formData
            })

            const result = await res.json()
            console.log('Resume upload response:', result)

            if (res.ok && result.path) {
                // 이력서 버튼 찾아서 URL 업데이트
                const resumeButtonIndex = heroButtons.findIndex(btn =>
                    btn.text === '이력서' || btn.textEn === 'resume' || btn.url?.includes('resume')
                )

                if (resumeButtonIndex >= 0) {
                    const newBtns = [...heroButtons]
                    const targetBtn = newBtns[resumeButtonIndex]

                    // 기존 URL이 있고 dropdownItems가 없으면, 기존 URL을 첫 번째 아이템으로 이동
                    if (targetBtn.url && (!targetBtn.dropdownItems || targetBtn.dropdownItems.length === 0)) {
                        targetBtn.dropdownItems = [
                            { text: '기본 이력서', url: targetBtn.url }
                        ]
                    }

                    // 새 파일 추가
                    if (!targetBtn.dropdownItems) targetBtn.dropdownItems = []

                    // 파일명에서 확장자 제거하고 적절한 이름 생성
                    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
                    targetBtn.dropdownItems.push({
                        text: fileName,
                        url: result.path
                    })

                    // 메인 URL은 가장 최근 파일로 업데이트 (호환성 유지)
                    targetBtn.url = result.path

                    setHeroButtons(newBtns)
                    // 자동으로 저장
                    await handleUpdate('heroButtons', newBtns)
                    alert(`이력서 파일이 추가되었습니다!\n파일: ${result.fileName}\n목록에서 이름을 수정할 수 있습니다.`)
                } else {
                    alert(`이력서 파일이 업로드되었습니다!\n경로: ${result.path}\n버튼 URL을 수동으로 설정해주세요.`)
                }
            } else {
                const errorMsg = result.error || result.message || '알 수 없는 오류'
                console.error('Resume upload failed:', result)
                alert(`이력서 업로드 실패: ${errorMsg}`)
            }
        } catch (error) {
            console.error('Resume upload error:', error)
            alert(`이력서 업로드 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        } finally {
            setUploadingResume(false)
        }
    }

    const handleImageUpload = async (file: File, type: 'profile' | 'project' | 'publication', folder: string = 'uploads') => {
        setUploading(type)
        try {
            let fileToUpload = file

            // Compress image if it's larger than 2MB
            if (file.size > 2 * 1024 * 1024) {
                try {
                    fileToUpload = await compressImage(file, 1920, 0.85)
                    console.log(`이미지 압축: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`)
                } catch (compressError) {
                    console.warn('이미지 압축 실패, 원본 파일로 업로드:', compressError)
                    // 압축 실패 시 원본 파일 사용
                }
            }

            const formData = new FormData()
            formData.append('file', fileToUpload)
            formData.append('folder', folder)

            console.log('Uploading file:', {
                name: fileToUpload.name,
                size: fileToUpload.size,
                type: fileToUpload.type
            })

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            console.log('Upload response status:', res.status)

            const result = await res.json()
            console.log('Upload response:', result)

            if (res.ok && result.path) {
                // Update the appropriate state based on type
                if (type === 'profile') {
                    setProfile({ ...profile, image: result.path })
                } else if (type === 'project' && editingProject) {
                    setEditingProject({ ...editingProject, image: result.path })
                } else if (type === 'publication' && publications.length > 0) {
                    const newPubs = [...publications]
                    // 현재 편집 중인 publication에 이미지 적용
                    if (editingPublicationIndex >= 0 && editingPublicationIndex < newPubs.length) {
                        newPubs[editingPublicationIndex].image = result.path
                        setPublications(newPubs)
                        // 자동으로 저장
                        handleUpdate('publications', newPubs)
                    } else {
                        // 인덱스가 없으면 첫 번째에 적용
                        newPubs[0].image = result.path
                        setPublications(newPubs)
                        handleUpdate('publications', newPubs)
                    }
                }
                alert('이미지가 업로드되었습니다!')
            } else {
                const errorMsg = result.error || result.message || '알 수 없는 오류'
                console.error('Upload failed:', result)
                alert(`업로드 실패: ${errorMsg}`)
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert(`업로드 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        } finally {
            setUploading(null)
        }
    }

    // --- Render Functions ---

    const renderProfile = () => {
        if (!profile) return null
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-cyan-400" /> 기본 정보
                    </h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">이름 (한글)</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">이름 (영문)</label>
                            <input
                                type="text"
                                value={profile.nameEn || ''}
                                onChange={(e) => setProfile({ ...profile, nameEn: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="Name (English)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">직함 (한글)</label>
                            <input
                                type="text"
                                value={profile.title || ''}
                                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">직함 (영문)</label>
                            <input
                                type="text"
                                value={profile.titleEn || ''}
                                onChange={(e) => setProfile({ ...profile, titleEn: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="Job Title (English)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">자기소개 (한글)</label>
                            <textarea
                                value={profile.bio || ''}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">자기소개 (영문)</label>
                            <textarea
                                value={profile.bioEn || ''}
                                onChange={(e) => setProfile({ ...profile, bioEn: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"
                                placeholder="Bio (English)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">상태 (한글, 예: 채용 가능)</label>
                            <input
                                type="text"
                                value={profile.status || ''}
                                onChange={(e) => setProfile({ ...profile, status: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">상태 (영문, 예: Available)</label>
                            <input
                                type="text"
                                value={profile.statusEn || ''}
                                onChange={(e) => setProfile({ ...profile, statusEn: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="Status (English)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">프로필 이미지</label>
                            {profile.image && (
                                <div className="mb-3 relative inline-block">
                                    <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                                        <Image
                                            src={profile.image}
                                            alt="Profile preview"
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setProfile({ ...profile, image: '' })}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(file, 'profile', 'uploads')
                                        }}
                                        disabled={uploading === 'profile'}
                                    />
                                    <div className={`w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-center flex items-center justify-center gap-2 ${uploading === 'profile' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        {uploading === 'profile' ? (
                                            <>업로드 중...</>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                이미지 업로드
                                            </>
                                        )}
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={profile.image || ''}
                                    onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                                    placeholder="또는 경로 입력"
                                    className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleUpdate('profile', profile)}
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold mt-2"
                        >
                            기본 정보 저장
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-cyan-400" /> 버튼 관리 (연락처/이력서/커피챗)
                    </h3>
                    <div className="space-y-4">
                        {heroButtons.map((btn, idx) => {
                            const isResumeButton = btn.text === '이력서' || btn.textEn === 'resume' || btn.url?.includes('resume')
                            return (
                                <div key={idx} className="p-4 bg-black/20 rounded border border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input
                                            type="text"
                                            value={btn.text || ''}
                                            onChange={(e) => {
                                                const newBtns = [...heroButtons]
                                                newBtns[idx].text = e.target.value
                                                setHeroButtons(newBtns)
                                            }}
                                            className="bg-black/40 border border-white/10 rounded p-2 text-white"
                                            placeholder="버튼 텍스트 (한글)"
                                        />
                                        <input
                                            type="text"
                                            value={btn.textEn || ''}
                                            onChange={(e) => {
                                                const newBtns = [...heroButtons]
                                                newBtns[idx].textEn = e.target.value
                                                setHeroButtons(newBtns)
                                            }}
                                            className="bg-black/40 border border-white/10 rounded p-2 text-white"
                                            placeholder="버튼 텍스트 (영문)"
                                        />
                                        {isResumeButton ? (
                                            <>
                                                <div className="col-span-3 space-y-4 border-t border-white/10 pt-4 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-medium text-white/80">이력서 파일 목록</label>
                                                        <label className="cursor-pointer px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-white text-xs flex items-center gap-1">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp,.hwpx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) {
                                                                        handleResumeUpload(file)
                                                                    }
                                                                }}
                                                                disabled={uploadingResume}
                                                            />
                                                            {uploadingResume ? '업로드 중...' : (
                                                                <>
                                                                    <Plus className="w-3 h-3" /> 파일 추가
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>

                                                    {/* Dropdown Items List */}
                                                    <div className="space-y-2">
                                                        {(!btn.dropdownItems || btn.dropdownItems.length === 0) && btn.url && (
                                                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5">
                                                                <span className="text-xs text-white/60 px-2 py-0.5 bg-white/10 rounded">기본</span>
                                                                <input
                                                                    type="text"
                                                                    value={btn.text}
                                                                    readOnly
                                                                    className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0"
                                                                />
                                                                <span className="text-xs text-white/40 truncate max-w-[150px]">{btn.url}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const newBtns = [...heroButtons]
                                                                        newBtns[idx].url = ''
                                                                        setHeroButtons(newBtns)
                                                                    }}
                                                                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                                    title="삭제"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {btn.dropdownItems?.map((item: any, itemIdx: number) => (
                                                            <div key={itemIdx} className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/5">
                                                                <input
                                                                    type="text"
                                                                    value={item.text}
                                                                    onChange={(e) => {
                                                                        const newBtns = [...heroButtons]
                                                                        if (!newBtns[idx].dropdownItems) newBtns[idx].dropdownItems = []
                                                                        newBtns[idx].dropdownItems[itemIdx].text = e.target.value
                                                                        setHeroButtons(newBtns)
                                                                    }}
                                                                    className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-cyan-500 outline-none"
                                                                    placeholder="표시 이름 (예: 국문 이력서)"
                                                                />
                                                                <span className="text-xs text-white/40 truncate max-w-[150px]" title={item.url}>{item.url}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const newBtns = [...heroButtons]
                                                                        newBtns[idx].dropdownItems = newBtns[idx].dropdownItems.filter((_: any, i: number) => i !== itemIdx)
                                                                        setHeroButtons(newBtns)
                                                                    }}
                                                                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                                                                    title="삭제"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}

                                                        {(!btn.url && (!btn.dropdownItems || btn.dropdownItems.length === 0)) && (
                                                            <div className="text-center py-4 text-white/40 text-sm border border-dashed border-white/10 rounded">
                                                                등록된 이력서 파일이 없습니다.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <input
                                                type="text"
                                                value={btn.url}
                                                onChange={(e) => {
                                                    const newBtns = [...heroButtons]
                                                    newBtns[idx].url = e.target.value
                                                    setHeroButtons(newBtns)
                                                }}
                                                className="bg-black/40 border border-white/10 rounded p-2 text-white col-span-2"
                                                placeholder="URL (mailto:..., /resume.pdf, https://...)"
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        <button
                            onClick={() => handleUpdate('heroButtons', heroButtons)}
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold"
                        >
                            버튼 정보 저장
                        </button>
                    </div >
                </div >
            </div >
        )
    }

    const renderExperience = () => {
        const addExperience = () => {
            setExperience([...experience, {
                id: Date.now(),
                role: '',
                roleEn: '',
                company: '',
                companyEn: '',
                period: '',
                periodEn: '',
                color: 'text-white'
            }])
        }
        const removeExperience = (idx: number) => {
            setExperience(experience.filter((_, i) => i !== idx))
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-purple-400" /> 경력 목록
                    </h3>
                    <button onClick={addExperience} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 추가
                    </button>
                </div>

                {experience.map((exp, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 grid gap-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">역할 (한글)</label>
                                    <input
                                        placeholder="예: 시니어 개발자"
                                        value={exp.role || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].role = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">역할 (영문)</label>
                                    <input
                                        placeholder="예: Senior Developer"
                                        value={exp.roleEn || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].roleEn = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">회사명 (한글)</label>
                                    <input
                                        placeholder="예: 스타트업 스튜디오"
                                        value={exp.company || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].company = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">회사명 (영문)</label>
                                    <input
                                        placeholder="예: Startup Studio"
                                        value={exp.companyEn || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].companyEn = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">기간 (한글)</label>
                                    <input
                                        placeholder="예: 2022-현재"
                                        value={exp.period || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].period = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/70 mb-1">기간 (영문)</label>
                                    <input
                                        placeholder="예: 2022-Present"
                                        value={exp.periodEn || ''}
                                        onChange={(e) => {
                                            const newExp = [...experience]
                                            newExp[idx].periodEn = e.target.value
                                            setExperience(newExp)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/70 mb-1">색상 클래스</label>
                                <input
                                    placeholder="예: text-cyan-400"
                                    value={exp.color || ''}
                                    onChange={(e) => {
                                        const newExp = [...experience]
                                        newExp[idx].color = e.target.value
                                        setExperience(newExp)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end bg-black/20 p-2 rounded-lg mt-2">
                            <button
                                onClick={() => {
                                    if (idx === 0) return
                                    const newExp = [...experience]
                                    const temp = newExp[idx]
                                    newExp[idx] = newExp[idx - 1]
                                    newExp[idx - 1] = temp
                                    setExperience(newExp)
                                }}
                                disabled={idx === 0}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="위로 이동"
                            >
                                <Icons.ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (idx === experience.length - 1) return
                                    const newExp = [...experience]
                                    const temp = newExp[idx]
                                    newExp[idx] = newExp[idx + 1]
                                    newExp[idx + 1] = temp
                                    setExperience(newExp)
                                }}
                                disabled={idx === experience.length - 1}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="아래로 이동"
                            >
                                <Icons.ArrowDown className="w-4 h-4" />
                            </button>
                            <div className="w-px bg-white/10 mx-1"></div>
                            <button onClick={() => removeExperience(idx)} className="text-red-400 text-sm hover:text-red-300 hover:bg-red-500/20 px-3 rounded transition-colors flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> 삭제
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    onClick={() => handleUpdate('experience', experience)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded text-white font-bold"
                >
                    경력 변경사항 저장
                </button>
            </div>
        )
    }

    // Popover States for Skills
    const [openIconPopovers, setOpenIconPopovers] = useState<Record<number, boolean>>({})
    const [openColorPopovers, setOpenColorPopovers] = useState<Record<number, boolean>>({})

    const renderSkills = () => {
        const addSkill = () => {
            setSkills([...skills, { name: '', icon: 'Circle', color: 'text-white' }])
        }
        const removeSkill = (idx: number) => {
            setSkills(skills.filter((_, i) => i !== idx))
        }

        // 자주 사용되는 기술 스택 아이콘 목록
        const commonIcons = [
            'Code2', 'Globe', 'Terminal', 'Layout', 'Server', 'Database', 'Smartphone', 'Layers', 'Cpu',
            'FileJson', 'Cloud', 'GitBranch', 'Command', 'Hash', 'Monitor', 'Wifi', 'Box',
            'Code', 'Zap', 'Shield', 'Lock', 'Key', 'Settings', 'Wrench', 'Tool',
            'Package', 'Folder', 'FileCode', 'FileText', 'File', 'Image', 'Video', 'Music',
            'Palette', 'Brush', 'PenTool', 'MousePointer', 'Type', 'Bold', 'Italic',
            'Link', 'ExternalLink', 'Download', 'Upload', 'Share', 'Copy', 'Check', 'X',
            'Circle', 'Square', 'Triangle', 'Hexagon', 'Star', 'Heart', 'ThumbsUp',
            'Rocket', 'Target', 'Trophy', 'Award', 'Medal', 'Crown', 'Flame',
            'Atom', 'Brain', 'Lightbulb', 'Search', 'Filter', 'Grid', 'List',
            'BarChart', 'LineChart', 'PieChart', 'TrendingUp', 'TrendingDown',
            'MessageSquare', 'Mail', 'Phone', 'Video', 'Camera', 'Mic', 'Headphones',
            'Play', 'Pause', 'SkipForward', 'SkipBack', 'Volume', 'VolumeX',
            'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Droplet',
            'Map', 'MapPin', 'Navigation', 'Compass', 'Globe2', 'Earth',
            'User', 'Users', 'UserPlus', 'UserMinus', 'UserCheck', 'UserX',
            'ShoppingCart', 'ShoppingBag', 'CreditCard', 'Wallet', 'Coins',
            'Calendar', 'Clock', 'Timer', 'Stopwatch', 'Hourglass',
            'Home', 'Building', 'Building2', 'Factory', 'Warehouse',
            'Car', 'Plane', 'Ship', 'Bike', 'Train', 'Bus',
            'Gamepad', 'Gamepad2', 'Dice', 'Puzzle', 'Chess',
            'Book', 'BookOpen', 'BookMarked', 'GraduationCap', 'School',
            'Briefcase', 'Suitcase', 'Luggage', 'FolderOpen', 'Archive',
            'Coffee', 'Utensils', 'Wine', 'Beer', 'Cookie',
            'Heart', 'HeartHandshake', 'Smile', 'Laugh', 'Frown',
            'AlertCircle', 'AlertTriangle', 'Info', 'HelpCircle', 'CheckCircle',
            'XCircle', 'Ban', 'ShieldAlert', 'ShieldCheck', 'ShieldOff',
            'Bot', 'Sparkles'
        ]

        // 아이콘 한글 설명 매핑
        const iconDescriptions: Record<string, string> = {
            'Code2': '코드/프로그래밍',
            'Globe': '웹/글로벌',
            'Terminal': '터미널/명령줄',
            'Layout': '레이아웃/디자인',
            'Server': '서버/백엔드',
            'Database': '데이터베이스',
            'Smartphone': '모바일 앱',
            'Layers': '레이어/시스템',
            'Cpu': '프로세서/성능',
            'FileJson': 'JSON 파일',
            'Cloud': '클라우드',
            'GitBranch': 'Git/버전관리',
            'Command': '명령어',
            'Hash': '해시태그',
            'Monitor': '모니터/화면',
            'Wifi': '무선 네트워크',
            'Box': '박스/컨테이너',
            'Code': '코드',
            'Zap': '번개/빠름',
            'Shield': '보안/방어',
            'Lock': '잠금/보안',
            'Key': '키/인증',
            'Settings': '설정',
            'Wrench': '도구/수리',
            'Tool': '도구',
            'Package': '패키지',
            'Folder': '폴더',
            'FileCode': '코드 파일',
            'FileText': '텍스트 파일',
            'File': '파일',
            'Image': '이미지',
            'Video': '비디오',
            'Music': '음악',
            'Palette': '팔레트/색상',
            'Brush': '브러시/그리기',
            'PenTool': '펜 도구',
            'MousePointer': '마우스 포인터',
            'Type': '타입/텍스트',
            'Bold': '굵게',
            'Italic': '기울임',
            'Link': '링크',
            'ExternalLink': '외부 링크',
            'Download': '다운로드',
            'Upload': '업로드',
            'Share': '공유',
            'Copy': '복사',
            'Check': '확인',
            'X': '닫기',
            'Circle': '원',
            'Square': '사각형',
            'Triangle': '삼각형',
            'Hexagon': '육각형',
            'Star': '별',
            'Heart': '하트',
            'ThumbsUp': '좋아요',
            'Rocket': '로켓/런칭',
            'Target': '타겟/목표',
            'Trophy': '트로피/성과',
            'Award': '상/수상',
            'Medal': '메달',
            'Crown': '왕관/최고',
            'Flame': '불꽃/인기',
            'Atom': '원자/과학',
            'Brain': '뇌/지능',
            'Lightbulb': '전구/아이디어',
            'Search': '검색',
            'Filter': '필터',
            'Grid': '그리드',
            'List': '목록',
            'BarChart': '막대 그래프',
            'LineChart': '선 그래프',
            'PieChart': '파이 차트',
            'TrendingUp': '상승 추세',
            'TrendingDown': '하락 추세',
            'MessageSquare': '메시지',
            'Mail': '이메일',
            'Phone': '전화',
            'Camera': '카메라',
            'Mic': '마이크',
            'Headphones': '헤드폰',
            'Play': '재생',
            'Pause': '일시정지',
            'SkipForward': '다음',
            'SkipBack': '이전',
            'Volume': '볼륨',
            'VolumeX': '음소거',
            'Sun': '태양',
            'Moon': '달',
            'Cloud': '구름',
            'CloudRain': '비',
            'CloudSnow': '눈',
            'Wind': '바람',
            'Droplet': '물방울',
            'Map': '지도',
            'MapPin': '위치 핀',
            'Navigation': '내비게이션',
            'Compass': '나침반',
            'Globe2': '지구본',
            'Earth': '지구',
            'User': '사용자',
            'Users': '사용자들',
            'UserPlus': '사용자 추가',
            'UserMinus': '사용자 제거',
            'UserCheck': '사용자 확인',
            'UserX': '사용자 삭제',
            'ShoppingCart': '쇼핑카트',
            'ShoppingBag': '쇼핑백',
            'CreditCard': '신용카드',
            'Wallet': '지갑',
            'Coins': '동전',
            'Calendar': '캘린더',
            'Clock': '시계',
            'Timer': '타이머',
            'Stopwatch': '스톱워치',
            'Hourglass': '모래시계',
            'Home': '홈',
            'Building': '건물',
            'Building2': '건물 2',
            'Factory': '공장',
            'Warehouse': '창고',
            'Car': '자동차',
            'Plane': '비행기',
            'Ship': '배',
            'Bike': '자전거',
            'Train': '기차',
            'Bus': '버스',
            'Gamepad': '게임패드',
            'Gamepad2': '게임패드 2',
            'Dice': '주사위',
            'Puzzle': '퍼즐',
            'Chess': '체스',
            'Book': '책',
            'BookOpen': '열린 책',
            'BookMarked': '책갈피',
            'GraduationCap': '졸업모',
            'School': '학교',
            'Briefcase': '서류가방',
            'Suitcase': '여행가방',
            'Luggage': '짐',
            'FolderOpen': '열린 폴더',
            'Archive': '아카이브',
            'Coffee': '커피',
            'Utensils': '식기',
            'Wine': '와인',
            'Beer': '맥주',
            'Cookie': '쿠키',
            'HeartHandshake': '악수 하트',
            'Smile': '웃음',
            'Laugh': '큰 웃음',
            'Frown': '찡그림',
            'AlertCircle': '경고 원',
            'AlertTriangle': '경고 삼각형',
            'Info': '정보',
            'HelpCircle': '도움말',
            'CheckCircle': '확인 원',
            'XCircle': '닫기 원',
            'Ban': '금지',
            'ShieldAlert': '보안 경고',
            'ShieldCheck': '보안 확인',
            'ShieldOff': '보안 해제',
            'Bot': '봇/AI/자동화',
            'Sparkles': 'AI/매직/반짝임'
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Code className="w-5 h-5 text-green-400" /> 기술 스택
                    </h3>
                    <button onClick={addSkill} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-sm flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 추가
                    </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-300 mb-2">
                        💡 <strong>아이콘 사용 팁:</strong> Lucide React의 모든 아이콘을 사용할 수 있습니다.
                    </p>
                    <p className="text-xs text-blue-200/80 mb-3">
                        자주 사용되는 아이콘: {commonIcons.slice(0, 20).join(', ')} ... 외 100개 이상
                    </p>
                    <details className="text-xs">
                        <summary className="cursor-pointer text-blue-300 hover:text-blue-200 mb-2">전체 아이콘 목록 보기</summary>
                        <div className="mt-2 max-h-60 overflow-y-auto bg-black/20 rounded p-2">
                            <TooltipProvider delayDuration={0}>
                                <div className="grid grid-cols-6 gap-2">
                                    {commonIcons.map((iconName) => {
                                        const Icon = (Icons as any)[iconName] || Code
                                        const description = iconDescriptions[iconName] || iconName
                                        return (
                                            <Tooltip key={iconName}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        onClick={() => {
                                                            if (skills.length > 0) {
                                                                const newSkills = [...skills]
                                                                newSkills[newSkills.length - 1].icon = iconName
                                                                setSkills(newSkills)
                                                            }
                                                        }}
                                                        className="flex flex-col items-center gap-1 p-2 text-blue-200/70 text-xs hover:bg-white/10 rounded cursor-pointer border border-transparent hover:border-blue-500/30 transition-all"
                                                    >
                                                        <Icon className="w-5 h-5 text-white" />
                                                        <span className="text-[10px] text-center leading-tight">{iconName}</span>
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-black/90 border-white/10 text-white text-xs">
                                                    <p>{description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    })}
                                </div>
                            </TooltipProvider>
                        </div>
                    </details>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map((skill, idx) => {
                        const IconComponent = (Icons as any)[skill.icon] || Code
                        return (
                            <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <input
                                        placeholder="기술명 (예: React)"
                                        value={skill.name}
                                        onChange={(e) => {
                                            const newSkills = [...skills]
                                            newSkills[idx].name = e.target.value
                                            setSkills(newSkills)
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                    />
                                    <div className="flex gap-2 items-center">
                                        <Popover
                                            open={!!openIconPopovers[idx]}
                                            onOpenChange={(open) => setOpenIconPopovers(prev => ({ ...prev, [idx]: open }))}
                                        >
                                            <PopoverTrigger asChild>
                                                <button className="w-1/2 bg-black/20 border border-white/10 rounded p-2 text-white text-xs flex items-center justify-between hover:bg-black/30">
                                                    <span className="flex items-center gap-2">
                                                        <IconComponent className="w-4 h-4" />
                                                        {skill.icon || '아이콘 선택'}
                                                    </span>
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 max-h-60 overflow-y-auto">
                                                <TooltipProvider delayDuration={0}>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {commonIcons.map((iconName) => {
                                                            const Icon = (Icons as any)[iconName] || Code
                                                            const description = iconDescriptions[iconName] || iconName
                                                            return (
                                                                <Tooltip key={iconName}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newSkills = [...skills]
                                                                                newSkills[idx].icon = iconName
                                                                                setSkills(newSkills)
                                                                                setOpenIconPopovers(prev => ({ ...prev, [idx]: false }))
                                                                            }}
                                                                            className={`p-2 rounded border transition-colors flex flex-col items-center gap-1 ${skill.icon === iconName
                                                                                ? 'bg-green-500/20 border-green-500/50'
                                                                                : 'bg-black/20 border-white/10 hover:bg-white/10'
                                                                                }`}
                                                                        >
                                                                            <Icon className="w-4 h-4 text-white" />
                                                                            <span className="text-xs text-white/60">{iconName}</span>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="bg-black/90 border-white/10 text-white text-xs">
                                                                        <p>{description}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )
                                                        })}
                                                    </div>
                                                </TooltipProvider>
                                            </PopoverContent>
                                        </Popover>
                                        <Popover
                                            open={!!openColorPopovers[idx]}
                                            onOpenChange={(open) => setOpenColorPopovers(prev => ({ ...prev, [idx]: open }))}
                                        >
                                            <PopoverTrigger asChild>
                                                <button className="w-1/2 bg-black/20 border border-white/10 rounded p-2 text-white text-xs flex items-center justify-between hover:bg-black/30">
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="w-4 h-4 rounded border border-white/20"
                                                            style={{
                                                                backgroundColor: skill.color?.includes('text-')
                                                                    ? undefined
                                                                    : skill.color || '#ffffff'
                                                            }}
                                                        />
                                                        <span className={skill.color || 'text-white'}>
                                                            {skill.color || '색상 선택'}
                                                        </span>
                                                    </span>
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 bg-zinc-900 border-zinc-800">
                                                <div className="space-y-3">
                                                    <p className="text-xs text-white/60 mb-2">색상 선택</p>
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {[
                                                            { name: 'white', shades: ['white'] },
                                                            { name: 'black', shades: ['black'] },
                                                            { name: 'gray', shades: ['300', '400', '500', '600', '700'] },
                                                            { name: 'red', shades: ['400', '500', '600'] },
                                                            { name: 'orange', shades: ['400', '500', '600'] },
                                                            { name: 'yellow', shades: ['400', '500', '600'] },
                                                            { name: 'green', shades: ['400', '500', '600'] },
                                                            { name: 'cyan', shades: ['300', '400', '500', '600'] },
                                                            { name: 'blue', shades: ['300', '400', '500', '600'] },
                                                            { name: 'indigo', shades: ['400', '500', '600'] },
                                                            { name: 'purple', shades: ['400', '500', '600'] },
                                                            { name: 'pink', shades: ['400', '500', '600'] },
                                                        ].map((colorGroup) =>
                                                            colorGroup.shades.map((shade) => {
                                                                const colorClass = shade === 'white' || shade === 'black'
                                                                    ? `text-${shade}`
                                                                    : `text-${colorGroup.name}-${shade}`
                                                                const colorMap: Record<string, string> = {
                                                                    'text-white': '#ffffff',
                                                                    'text-black': '#000000',
                                                                    'text-gray-300': '#d1d5db',
                                                                    'text-gray-400': '#9ca3af',
                                                                    'text-gray-500': '#6b7280',
                                                                    'text-gray-600': '#4b5563',
                                                                    'text-gray-700': '#374151',
                                                                    'text-red-400': '#f87171',
                                                                    'text-red-500': '#ef4444',
                                                                    'text-red-600': '#dc2626',
                                                                    'text-orange-400': '#fb923c',
                                                                    'text-orange-500': '#f97316',
                                                                    'text-orange-600': '#ea580c',
                                                                    'text-yellow-400': '#facc15',
                                                                    'text-yellow-500': '#eab308',
                                                                    'text-yellow-600': '#ca8a04',
                                                                    'text-green-400': '#4ade80',
                                                                    'text-green-500': '#22c55e',
                                                                    'text-green-600': '#16a34a',
                                                                    'text-cyan-300': '#67e8f9',
                                                                    'text-cyan-400': '#22d3ee',
                                                                    'text-cyan-500': '#06b6d4',
                                                                    'text-cyan-600': '#0891b2',
                                                                    'text-blue-300': '#93c5fd',
                                                                    'text-blue-400': '#60a5fa',
                                                                    'text-blue-500': '#3b82f6',
                                                                    'text-blue-600': '#2563eb',
                                                                    'text-indigo-400': '#818cf8',
                                                                    'text-indigo-500': '#6366f1',
                                                                    'text-indigo-600': '#4f46e5',
                                                                    'text-purple-400': '#a78bfa',
                                                                    'text-purple-500': '#9333ea',
                                                                    'text-purple-600': '#7e22ce',
                                                                    'text-pink-400': '#f472b6',
                                                                    'text-pink-500': '#ec4899',
                                                                    'text-pink-600': '#db2777',
                                                                }
                                                                const hexColor = colorMap[colorClass] || '#ffffff'
                                                                return (
                                                                    <button
                                                                        key={colorClass}
                                                                        onClick={() => {
                                                                            const newSkills = [...skills]
                                                                            newSkills[idx].color = colorClass
                                                                            setSkills(newSkills)
                                                                            setOpenColorPopovers(prev => ({ ...prev, [idx]: false }))
                                                                        }}
                                                                        className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${skill.color === colorClass
                                                                            ? 'border-white ring-2 ring-white/50'
                                                                            : 'border-white/30 hover:border-white/60'
                                                                            }`}
                                                                        style={{ backgroundColor: hexColor }}
                                                                        title={colorClass}
                                                                    />
                                                                )
                                                            })
                                                        )}
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10">
                                                        <input
                                                            type="text"
                                                            placeholder="직접 입력 (예: text-blue-400)"
                                                            value={skill.color}
                                                            onChange={(e) => {
                                                                const newSkills = [...skills]
                                                                newSkills[idx].color = e.target.value
                                                                setSkills(newSkills)
                                                            }}
                                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-xs"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <button onClick={() => removeSkill(idx)} className="p-2 text-red-400 hover:bg-white/5 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>
                <button
                    onClick={() => handleUpdate('skills', skills)}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded text-white font-bold"
                >
                    기술 스택 저장
                </button>
            </div>
        )
    }

    const renderCertifications = () => {
        const addCertification = () => {
            setCertifications([...certifications, {
                id: Date.now(),
                name: '',
                nameEn: '',
                issuer: '',
                issuerEn: '',
                date: '',
                url: ''
            }])
        }
        const removeCertification = (idx: number) => {
            setCertifications(certifications.filter((_, i) => i !== idx))
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">자격증 관리</h3>
                    <button
                        onClick={addCertification}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> 자격증 추가
                    </button>
                </div>

                <div className="space-y-4">
                    {certifications.length === 0 ? (
                        <div className="text-center py-8 text-white/40">
                            자격증이 없습니다. 추가 버튼을 클릭하여 자격증을 추가하세요.
                        </div>
                    ) : (
                        certifications.map((cert, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-white/60 text-sm">자격증 #{idx + 1}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                if (idx === 0) return
                                                const newCerts = [...certifications]
                                                const temp = newCerts[idx]
                                                newCerts[idx] = newCerts[idx - 1]
                                                newCerts[idx - 1] = temp
                                                setCertifications(newCerts)
                                            }}
                                            disabled={idx === 0}
                                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="위로 이동"
                                        >
                                            <Icons.ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (idx === certifications.length - 1) return
                                                const newCerts = [...certifications]
                                                const temp = newCerts[idx]
                                                newCerts[idx] = newCerts[idx + 1]
                                                newCerts[idx + 1] = temp
                                                setCertifications(newCerts)
                                            }}
                                            disabled={idx === certifications.length - 1}
                                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="아래로 이동"
                                        >
                                            <Icons.ArrowDown className="w-4 h-4" />
                                        </button>
                                        <div className="w-px bg-white/10 mx-1"></div>
                                        <button
                                            onClick={() => removeCertification(idx)}
                                            className="p-2 text-red-400 hover:bg-white/5 rounded"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">자격증명 (한글)</label>
                                        <input
                                            type="text"
                                            value={cert.name || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].name = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="예: 정보처리기사"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">자격증명 (영문)</label>
                                        <input
                                            type="text"
                                            value={cert.nameEn || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].nameEn = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="예: Information Processing Engineer"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">발행기관 (한글)</label>
                                        <input
                                            type="text"
                                            value={cert.issuer || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].issuer = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="예: 한국산업인력공단"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">발행기관 (영문)</label>
                                        <input
                                            type="text"
                                            value={cert.issuerEn || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].issuerEn = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="예: Human Resources Development Service"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">취득일</label>
                                        <input
                                            type="text"
                                            value={cert.date || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].date = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="예: 2020"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-white/70 mb-1">링크 URL (선택사항)</label>
                                        <input
                                            type="text"
                                            value={cert.url || ''}
                                            onChange={(e) => {
                                                const newCerts = [...certifications]
                                                newCerts[idx].url = e.target.value
                                                setCertifications(newCerts)
                                            }}
                                            placeholder="https://example.com"
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => handleUpdate('certifications', certifications)}
                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded text-white font-bold"
                >
                    자격증 저장
                </button>
            </div>
        )
    }

    const renderProjects = () => {
        const handleProjectSubmit = async (e: React.FormEvent) => {
            e.preventDefault()
            const method = editingProjectIndex === -1 ? 'POST' : 'PUT'
            const body = method === 'POST'
                ? editingProject
                : { id: editingProject.id, project: editingProject }

            try {
                const res = await fetch('/api/projects', {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })
                const result = await res.json()
                if (res.ok) {
                    alert(editingProjectIndex === -1 ? '프로젝트 추가됨' : '프로젝트 수정됨')
                    setEditingProject(null)
                    setEditingProjectIndex(-1)
                    fetchAllData()
                } else {
                    alert(`실패: ${result.error || '알 수 없는 오류'}`)
                }
            } catch (error) {
                console.error(error)
                alert(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
            }
        }

        const handleDeleteProject = async (index: number) => {
            if (!confirm('정말 삭제하시겠습니까?')) return
            const projectToDelete = projects[index];
            try {
                const res = await fetch('/api/projects', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: projectToDelete.id })
                })
                const result = await res.json()
                if (res.ok) {
                    alert('프로젝트가 삭제되었습니다.')
                    fetchAllData()
                } else {
                    alert(`삭제 실패: ${result.error || '알 수 없는 오류'}`)
                }
            } catch (error) {
                console.error(error)
                alert(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
            }
        }

        if (editingProject) {
            return (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-300">
                    <h3 className="text-xl font-bold mb-4">{editingProjectIndex === -1 ? '새 프로젝트' : '프로젝트 수정'}</h3>
                    <form onSubmit={handleProjectSubmit} className="space-y-4">
                        <input
                            placeholder="제목 (한글)"
                            value={editingProject.title || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            required
                        />
                        <input
                            placeholder="제목 (영문)"
                            value={editingProject.titleEn || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, titleEn: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                        />
                        <textarea
                            placeholder="설명 (한글)"
                            value={editingProject.description || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"
                            required
                        />
                        <textarea
                            placeholder="설명 (영문)"
                            value={editingProject.descriptionEn || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, descriptionEn: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-24"
                        />
                        <div>
                            <label className="block text-sm text-white/60 mb-2">프로젝트 이미지</label>
                            {editingProject.image && (
                                <div className="mb-3 relative inline-block">
                                    <div className="w-48 h-32 rounded-lg overflow-hidden border border-white/10">
                                        <Image
                                            src={editingProject.image}
                                            alt="Project preview"
                                            width={192}
                                            height={128}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setEditingProject({ ...editingProject, image: '' })}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(file, 'project', 'uploads')
                                        }}
                                        disabled={uploading === 'project'}
                                    />
                                    <div className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded text-white text-center flex items-center justify-center gap-2 ${uploading === 'project' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        {uploading === 'project' ? (
                                            <>업로드 중...</>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                이미지 업로드
                                            </>
                                        )}
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={editingProject.image || ''}
                                    onChange={(e) => setEditingProject({ ...editingProject, image: e.target.value })}
                                    placeholder="또는 경로 입력"
                                    className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                            </div>
                        </div>
                        <input
                            placeholder="링크 (https://...)"
                            value={editingProject.link}
                            onChange={(e) => setEditingProject({ ...editingProject, link: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                        />
                        <div>
                            <label className="text-sm text-white/60">태그 (쉼표로 구분)</label>
                            <input
                                placeholder="React, Next.js, Tailwind"
                                value={editingProject.tags.join(', ')}
                                onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value.split(',').map((t: string) => t.trim()) })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 py-2 bg-cyan-600 rounded text-white font-bold">저장</button>
                            <button type="button" onClick={() => setEditingProject(null)} className="flex-1 py-2 bg-white/10 rounded text-white">취소</button>
                        </div>
                    </form>
                </div>
            )
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Folder className="w-5 h-5 text-blue-400" /> 프로젝트 목록
                    </h3>
                    <button
                        onClick={() => {
                            setEditingProject({ title: '', description: '', image: '', link: '', tags: [] })
                            setEditingProjectIndex(-1)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" /> 추가
                    </button>
                </div>

                <div className="grid gap-4">
                    {projects.map((proj, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{proj.title}</h4>
                                <p className="text-sm text-white/60 line-clamp-1">{proj.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingProject(proj)
                                        setEditingProjectIndex(idx)
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded text-cyan-400"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(idx)}
                                    className="p-2 bg-white/10 hover:bg-red-500/20 rounded text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderBlog = () => {
        if (!blog) return null
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-green-500" /> 블로그 설정
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">블로그 제목</label>
                            <input
                                value={blog.title}
                                onChange={(e) => setBlog({ ...blog, title: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">설명</label>
                            <input
                                value={blog.description}
                                onChange={(e) => setBlog({ ...blog, description: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">URL</label>
                            <input
                                value={blog.url}
                                onChange={(e) => setBlog({ ...blog, url: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <button
                            onClick={() => handleUpdate('blog', blog)}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded text-white font-bold"
                        >
                            블로그 정보 저장
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderPublications = () => {
        const addPublication = () => {
            const newPub = {
                id: `pub_${Date.now()}`,
                tag: '대표 저서',
                tagEn: 'Featured Book',
                title: '',
                titleEn: '',
                description: '',
                descriptionEn: '',
                image: '',
                link: '',
                purchaseLinks: [] as Array<{ name: string; url: string }>
            }
            setPublications([...publications, newPub])
            setEditingPublicationIndex(publications.length)
        }

        const addPurchaseLink = (pubIdx: number) => {
            const newPubs = [...publications]
            if (!newPubs[pubIdx].purchaseLinks) {
                newPubs[pubIdx].purchaseLinks = []
            }
            newPubs[pubIdx].purchaseLinks.push({ name: '', url: '' })
            setPublications(newPubs)
        }

        const removePurchaseLink = (pubIdx: number, linkIdx: number) => {
            const newPubs = [...publications]
            if (newPubs[pubIdx].purchaseLinks) {
                newPubs[pubIdx].purchaseLinks = newPubs[pubIdx].purchaseLinks.filter((_, i) => i !== linkIdx)
                setPublications(newPubs)
            }
        }

        const updatePurchaseLink = (pubIdx: number, linkIdx: number, field: 'name' | 'url', value: string) => {
            const newPubs = [...publications]
            if (!newPubs[pubIdx].purchaseLinks) {
                newPubs[pubIdx].purchaseLinks = []
            }
            if (newPubs[pubIdx].purchaseLinks[linkIdx]) {
                newPubs[pubIdx].purchaseLinks[linkIdx][field] = value
                setPublications(newPubs)
            }
        }

        const removePublication = (idx: number) => {
            if (publications.length <= 1) {
                alert('최소 하나의 저서는 유지해야 합니다.')
                return
            }
            setPublications(publications.filter((_, i) => i !== idx))
            if (editingPublicationIndex >= publications.length - 1) {
                setEditingPublicationIndex(Math.max(0, editingPublicationIndex - 1))
            }
        }

        if (!publications || publications.length === 0) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Book className="w-5 h-5 text-amber-500" /> 대표 저서
                            </h3>
                            <button
                                onClick={addPublication}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm flex items-center gap-1">
                                <Plus className="w-4 h-4" /> 저서 추가
                            </button>
                        </div>
                        <p className="text-white/60 mb-4">저서 정보가 없습니다.</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Book className="w-5 h-5 text-amber-500" /> 대표 저서 목록 ({publications.length}개)
                    </h3>
                    <button
                        onClick={addPublication}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-white text-sm flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 저서 추가
                    </button>
                </div>

                {publications.map((pub, idx) => (
                    <div key={pub.id || idx} className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-amber-400">저서 #{idx + 1}</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingPublicationIndex(idx)}
                                    className={`px-3 py-1 rounded text-sm ${editingPublicationIndex === idx ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                    {editingPublicationIndex === idx ? '편집 중' : '편집'}
                                </button>
                                <button
                                    onClick={() => removePublication(idx)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm flex items-center gap-1">
                                    <X className="w-4 h-4" /> 삭제
                                </button>
                            </div>
                        </div>

                        {editingPublicationIndex === idx && (
                            <div className="space-y-4">
                                <input
                                    placeholder="제목 (한글)"
                                    value={pub.title || ''}
                                    onChange={(e) => {
                                        const newPubs = [...publications]
                                        newPubs[idx].title = e.target.value
                                        setPublications(newPubs)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                />
                                <input
                                    placeholder="제목 (영문)"
                                    value={pub.titleEn || ''}
                                    onChange={(e) => {
                                        const newPubs = [...publications]
                                        newPubs[idx].titleEn = e.target.value
                                        setPublications(newPubs)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                />
                                <textarea
                                    placeholder="설명 (한글)"
                                    value={pub.description || ''}
                                    onChange={(e) => {
                                        const newPubs = [...publications]
                                        newPubs[idx].description = e.target.value
                                        setPublications(newPubs)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-28 resize-y min-h-[112px] break-words"
                                />
                                <textarea
                                    placeholder="설명 (영문)"
                                    value={pub.descriptionEn || ''}
                                    onChange={(e) => {
                                        const newPubs = [...publications]
                                        newPubs[idx].descriptionEn = e.target.value
                                        setPublications(newPubs)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-28 resize-y min-h-[112px] break-words"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        placeholder="태그 (한글, 예: 대표 저서)"
                                        value={pub.tag || ''}
                                        onChange={(e) => {
                                            const newPubs = [...publications]
                                            newPubs[idx].tag = e.target.value
                                            setPublications(newPubs)
                                        }}
                                        className="bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                    <input
                                        placeholder="태그 (영문, 예: Featured Book)"
                                        value={pub.tagEn || ''}
                                        onChange={(e) => {
                                            const newPubs = [...publications]
                                            newPubs[idx].tagEn = e.target.value
                                            setPublications(newPubs)
                                        }}
                                        className="bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                    <input
                                        placeholder="링크 URL"
                                        value={pub.link || ''}
                                        onChange={(e) => {
                                            const newPubs = [...publications]
                                            newPubs[idx].link = e.target.value
                                            setPublications(newPubs)
                                        }}
                                        className="bg-black/20 border border-white/10 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">저서 이미지</label>
                                    {pub.image && (
                                        <div className="mb-3 relative inline-block">
                                            <div className="w-48 h-32 rounded-lg overflow-hidden border border-white/10">
                                                <Image
                                                    src={pub.image}
                                                    alt="Publication preview"
                                                    width={192}
                                                    height={128}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newPubs = [...publications]
                                                    newPubs[idx].image = ''
                                                    setPublications(newPubs)
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <label className="flex-1 cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setEditingPublicationIndex(idx)
                                                        handleImageUpload(file, 'publication', 'uploads')
                                                    }
                                                }}
                                                disabled={uploading === 'publication'}
                                            />
                                            <div className={`w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 rounded text-white text-center flex items-center justify-center gap-2 ${uploading === 'publication' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                {uploading === 'publication' ? (
                                                    <>업로드 중...</>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4" />
                                                        이미지 업로드
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                        <input
                                            type="text"
                                            value={pub.image || ''}
                                            onChange={(e) => {
                                                const newPubs = [...publications]
                                                newPubs[idx].image = e.target.value
                                                setPublications(newPubs)
                                            }}
                                            placeholder="또는 경로 입력"
                                            className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm text-white/60">구매 링크</label>
                                        <button
                                            onClick={() => addPurchaseLink(idx)}
                                            className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-white text-xs flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> 링크 추가
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {(pub.purchaseLinks || []).map((link: any, linkIdx: number) => (
                                            <div key={linkIdx} className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                                                <div className="flex gap-2 items-start">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex gap-2">
                                                            {['kyobo', 'yes24', 'aladin', 'ridi'].map(store => {
                                                                const storeNameMap: Record<string, string> = {
                                                                    'kyobo': '교보문고',
                                                                    'yes24': 'Yes24',
                                                                    'aladin': '알라딘',
                                                                    'ridi': '리디북스'
                                                                }
                                                                const targetName = storeNameMap[store]
                                                                const isActive = link.name === targetName || link.name?.toLowerCase().includes(store === 'kyobo' ? '교보' : store === 'aladin' ? '알라딘' : store === 'ridi' ? '리디' : 'yes')

                                                                return (
                                                                    <button
                                                                        key={store}
                                                                        onClick={() => updatePurchaseLink(idx, linkIdx, 'name', targetName)}
                                                                        className={`p-2 rounded transition-all flex items-center justify-center gap-1 ${isActive ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/50' : 'bg-black/20 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white'}`}
                                                                        title={targetName}
                                                                    >
                                                                        <StoreLogo store={store} className="w-4 h-4" />
                                                                        <span className="text-xs hidden xl:inline">{targetName}</span>
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="사이트명 (직접 입력 가능)"
                                                                value={link.name || ''}
                                                                onChange={(e) => updatePurchaseLink(idx, linkIdx, 'name', e.target.value)}
                                                                className="w-1/3 bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="구매 URL (https://...)"
                                                                value={link.url || ''}
                                                                onChange={(e) => updatePurchaseLink(idx, linkIdx, 'url', e.target.value)}
                                                                className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removePurchaseLink(idx, linkIdx)}
                                                        className="p-2 bg-red-600 hover:bg-red-500 rounded text-white h-full flex items-center justify-center"
                                                        title="삭제"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!pub.purchaseLinks || pub.purchaseLinks.length === 0) && (
                                            <p className="text-white/40 text-xs">구매 링크가 없습니다. "링크 추가" 버튼을 클릭하여 추가하세요.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            console.log('[Admin] Saving publication with purchaseLinks:', {
                                                idx,
                                                publication: publications[idx],
                                                purchaseLinks: publications[idx]?.purchaseLinks,
                                                allPublications: publications
                                            })
                                            setEditingPublicationIndex(idx)
                                            handleUpdate('publications', publications)
                                        }}
                                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded text-white font-bold"
                                    >
                                        저서 정보 저장
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('[Admin] Preview publication:', {
                                                publication: pub,
                                                purchaseLinks: pub?.purchaseLinks
                                            })
                                            setPreviewPublication(pub)
                                        }}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm flex items-center gap-1.5"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> 미리보기
                                    </button>
                                </div>
                            </div>
                        )}

                        {editingPublicationIndex !== idx && (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    {pub.image && (
                                        <div className="w-24 h-32 rounded overflow-hidden border border-white/10 shrink-0">
                                            <Image
                                                src={pub.image}
                                                alt={pub.title}
                                                width={96}
                                                height={128}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/90 font-semibold mb-1.5">{pub.title || '(제목 없음)'}</p>
                                        {pub.description && (
                                            <p className="text-white/60 text-sm leading-relaxed line-clamp-3 break-words">
                                                {pub.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <button
                        onClick={() => handleUpdate('publications', publications)}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded text-white font-bold"
                    >
                        모든 저서 정보 저장
                    </button>
                </div>
            </div>
        )
    }

    const renderCalendar = () => {
        if (!calendar) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-blue-500" /> 구글 캘린더 설정
                        </h3>
                        <p className="text-white/60 mb-4">캘린더가 설정되지 않았습니다.</p>
                        <button
                            onClick={() => setCalendar({ calendarId: '' })}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> 캘린더 추가
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 일정 추가 섹션 */}
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-green-500" /> 일정 추가
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">일정 제목 *</label>
                            <input
                                type="text"
                                value={newEvent.summary}
                                onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="예: 프로젝트 미팅"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">설명</label>
                            <textarea
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white h-20 resize-y"
                                placeholder="일정에 대한 상세 설명"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1">시작 일시 *</label>
                                <div className="space-y-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-left flex items-center justify-between hover:bg-black/30">
                                                <span>
                                                    {newEvent.startDate
                                                        ? format(newEvent.startDate, 'yyyy년 MM월 dd일')
                                                        : '날짜 선택'}
                                                </span>
                                                <CalendarIcon className="w-4 h-4 opacity-50" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={newEvent.startDate || undefined}
                                                onSelect={(date) => setNewEvent({ ...newEvent, startDate: date || null })}
                                                initialFocus
                                                className="bg-zinc-900"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex gap-2">
                                        <select
                                            value={newEvent.startTime.hour}
                                            onChange={(e) => setNewEvent({
                                                ...newEvent,
                                                startTime: { ...newEvent.startTime, hour: e.target.value }
                                            })}
                                            className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={String(i).padStart(2, '0')}>
                                                    {String(i).padStart(2, '0')}시
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={newEvent.startTime.minute}
                                            onChange={(e) => setNewEvent({
                                                ...newEvent,
                                                startTime: { ...newEvent.startTime, minute: e.target.value }
                                            })}
                                            className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white"
                                        >
                                            {[0, 15, 30, 45].map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>
                                                    {String(m).padStart(2, '0')}분
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">종료 일시</label>
                                <div className="space-y-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-left flex items-center justify-between hover:bg-black/30">
                                                <span>
                                                    {newEvent.endDate
                                                        ? format(newEvent.endDate, 'yyyy년 MM월 dd일')
                                                        : '날짜 선택'}
                                                </span>
                                                <CalendarIcon className="w-4 h-4 opacity-50" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={newEvent.endDate || undefined}
                                                onSelect={(date) => setNewEvent({ ...newEvent, endDate: date || null })}
                                                initialFocus
                                                className="bg-zinc-900"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex gap-2">
                                        <select
                                            value={newEvent.endTime.hour}
                                            onChange={(e) => setNewEvent({
                                                ...newEvent,
                                                endTime: { ...newEvent.endTime, hour: e.target.value }
                                            })}
                                            className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={String(i).padStart(2, '0')}>
                                                    {String(i).padStart(2, '0')}시
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={newEvent.endTime.minute}
                                            onChange={(e) => setNewEvent({
                                                ...newEvent,
                                                endTime: { ...newEvent.endTime, minute: e.target.value }
                                            })}
                                            className="flex-1 bg-black/20 border border-white/10 rounded p-2 text-white"
                                        >
                                            {[0, 15, 30, 45].map(m => (
                                                <option key={m} value={String(m).padStart(2, '0')}>
                                                    {String(m).padStart(2, '0')}분
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">장소</label>
                            <input
                                type="text"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="예: 서울시 강남구"
                            />
                        </div>
                        <button
                            onClick={async () => {
                                if (!newEvent.summary || !newEvent.startDate) {
                                    alert('일정 제목과 시작 날짜는 필수입니다.')
                                    return
                                }
                                const calendarData = calendar || {};
                                console.log('[Admin] Calendar data when registering event:', {
                                    calendarId: calendarData.calendarId,
                                    hasAccessToken: !!calendarData.accessToken,
                                    accessTokenLength: calendarData.accessToken?.length || 0,
                                    accessTokenPreview: calendarData.accessToken ? calendarData.accessToken.substring(0, 20) + '...' : '없음',
                                    fullCalendarData: calendarData
                                });

                                if (!calendarData.calendarId) {
                                    alert('먼저 캘린더 ID를 설정해주세요.')
                                    return
                                }

                                // accessToken이 없거나 빈 문자열인지 확인
                                const accessToken = calendarData.accessToken;
                                if (!accessToken || (typeof accessToken === 'string' && accessToken.trim() === '')) {
                                    console.error('[Admin] Access token is missing or empty');
                                    alert('OAuth 2.0 액세스 토큰이 필요합니다.\n\n1. 아래 "구글 캘린더 설정" 섹션으로 이동\n2. "OAuth 2.0 액세스 토큰" 필드에 토큰 입력\n3. "캘린더 설정 저장" 버튼 클릭\n\n현재 저장된 토큰: ' + (accessToken || '(없음)'))
                                    return
                                }

                                // 날짜와 시간을 결합하여 ISO 형식으로 변환
                                const formatDateTime = (date: Date | null, time: { hour: string, minute: string }) => {
                                    if (!date) return ''
                                    const year = date.getFullYear()
                                    const month = String(date.getMonth() + 1).padStart(2, '0')
                                    const day = String(date.getDate()).padStart(2, '0')
                                    const hour = time.hour.padStart(2, '0')
                                    const minute = time.minute.padStart(2, '0')
                                    return `${year}-${month}-${day}T${hour}:${minute}:00+09:00`
                                }

                                const startDateTime = formatDateTime(newEvent.startDate, newEvent.startTime)
                                const endDateTime = newEvent.endDate
                                    ? formatDateTime(newEvent.endDate, newEvent.endTime)
                                    : formatDateTime(newEvent.startDate, newEvent.endTime)

                                try {
                                    const response = await fetch('/api/calendar/create', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            calendarId: calendarData.calendarId,
                                            accessToken: calendarData.accessToken,
                                            refreshToken: calendarData.refreshToken,
                                            oauthClientId: calendarData.oauthClientId,
                                            oauthClientSecret: calendarData.oauthClientSecret,
                                            summary: newEvent.summary,
                                            description: newEvent.description || '',
                                            startDateTime,
                                            endDateTime,
                                            location: newEvent.location || ''
                                        })
                                    })

                                    const data = await response.json()

                                    if (response.ok && data.success) {
                                        // 새 액세스 토큰이 반환된 경우 자동 저장
                                        if (data.newAccessToken && calendarData.refreshToken) {
                                            console.log('[Admin] New access token received, updating...')
                                            const updatedCalendar = {
                                                ...calendarData,
                                                accessToken: data.newAccessToken
                                            }
                                            await handleUpdate('calendar', updatedCalendar, true)
                                            console.log('[Admin] Access token updated successfully')
                                        }

                                        alert('일정이 성공적으로 등록되었습니다!' + (data.newAccessToken ? '\n(토큰이 자동으로 갱신되었습니다)' : ''))

                                        // 폼 초기화
                                        setNewEvent({
                                            summary: '',
                                            description: '',
                                            startDate: null,
                                            startTime: { hour: '09', minute: '00' },
                                            endDate: null,
                                            endTime: { hour: '10', minute: '00' },
                                            location: ''
                                        })
                                    } else {
                                        // 인증 오류인 경우 상세 안내 표시
                                        if (data.code === 401 || data.error === '인증 실패') {
                                            const instructions = data.instructions ? '\n\n' + data.instructions.join('\n') : ''
                                            alert(
                                                `일정 등록 실패: ${data.error || data.message || '알 수 없는 오류'}\n\n` +
                                                `${data.details || ''}\n\n` +
                                                `${data.message || ''}` +
                                                instructions
                                            )
                                        } else {
                                            alert(`일정 등록 실패: ${data.error || data.message || '알 수 없는 오류'}\n${data.details ? `\n${data.details}` : ''}`)
                                        }
                                    }
                                } catch (error) {
                                    console.error('일정 등록 오류:', error)
                                    alert('일정 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
                                }
                            }}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded text-white font-bold flex items-center justify-center gap-2"
                        >
                            <CalendarIcon className="w-5 h-5" />
                            일정 등록
                        </button>
                        <p className="text-xs text-white/40">
                            💡 일정이 바로 Google Calendar에 등록됩니다. OAuth 2.0 액세스 토큰이 필요합니다.
                        </p>
                    </div>
                </div>

                {/* 구글 캘린더 설정 섹션 */}
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-500" /> 구글 캘린더 설정
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">구글 캘린더 ID</label>
                            <input
                                type="text"
                                value={calendar.calendarId || ''}
                                onChange={(e) => setCalendar({ ...calendar, calendarId: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="예: your-email@gmail.com 또는 캘린더 공개 ID"
                            />
                            <p className="text-xs text-white/40 mt-2 space-y-1">
                                <strong className="text-white/60">⚠️ 중요: OAuth 2.0 클라이언트 ID가 아닙니다!</strong><br />
                                <strong className="text-white/60">캘린더 ID 찾는 방법:</strong><br />
                                <br />
                                <strong className="text-yellow-400/80">가장 간단한 방법:</strong><br />
                                1. <strong>기본 캘린더</strong>를 사용하는 경우:<br />
                                - Google 계정의 <strong>이메일 주소</strong>를 그대로 입력<br />
                                - 예: <code className="text-cyan-400">zcan7898@gmail.com</code><br />
                                <br />
                                2. <strong>다른 캘린더</strong>를 사용하는 경우:<br />
                                - Google Calendar 접속<br />
                                - 왼쪽 사이드바에서 캘린더 이름 클릭<br />
                                - 설정 페이지에서 <strong>"공개 설정"</strong> 확인<br />
                                - 공개 URL에서 ID 확인 (아래 참고)<br />
                                <br />
                                <strong className="text-yellow-400/80">공개 설정 확인 (필수!):</strong><br />
                                <strong className="text-red-400/80">방법 1: 직접 URL로 확인</strong><br />
                                1. 아래 URL을 브라우저에서 열어보세요:<br />
                                <code className="text-xs text-cyan-300 break-all block mb-2 p-2 bg-black/40 rounded">https://calendar.google.com/calendar/ical/{calendar.calendarId || 'YOUR_EMAIL'}/public/basic.ics</code><br />
                                2. <strong className="text-green-400">캘린더 데이터가 보이면</strong> → 공개 설정 완료! ✅<br />
                                3. <strong className="text-red-400">404 오류가 나면</strong> → 공개 설정 필요<br />
                                <br />
                                <strong className="text-yellow-400/80">방법 2: Google Calendar에서 설정</strong><br />
                                1. Google Calendar 접속 (https://calendar.google.com)<br />
                                2. 왼쪽 사이드바에서 <strong>캘린더 이름</strong> 클릭<br />
                                3. 오른쪽에 나타나는 설정 패널에서<br />
                                4. <strong>"특정 사람과 공유"</strong> 섹션 찾기<br />
                                5. 또는 <strong>"공개 설정"</strong> 토글 찾기<br />
                                6. <strong>"공개: 모든 세부정보 보기"</strong> 선택<br />
                                <br />
                                <strong className="text-cyan-400/80">💡 공개 설정이 보이지 않으면:</strong><br />
                                - Google Calendar의 기본 캘린더는 공개 설정이 제한적일 수 있습니다<br />
                                - <strong>새 캘린더를 만들고</strong> 그 캘린더를 공개로 설정하는 것을 권장합니다<br />
                                - 또는 Google Calendar 웹 버전(데스크톱)에서 시도해보세요<br />
                                <br />
                                <strong className="text-cyan-400/80">💡 팁:</strong><br />
                                - 기본 캘린더는 이메일 주소만 입력하면 됩니다<br />
                                - 공개 설정이 안 되어 있으면 일정이 표시되지 않습니다<br />
                                - 현재 입력된 ID: <code className="text-white/60">{calendar.calendarId || '(없음)'}</code>
                                <br />
                                <strong className="text-yellow-400/80">⚠️ 필수: 캘린더 공개 설정</strong><br />
                                - 같은 설정 페이지에서 <strong>"공개 설정"</strong> 섹션 찾기<br />
                                - <strong>"공개: 모든 세부정보 보기"</strong> 선택 (반드시!)<br />
                                - 공개 설정이 없으면 iCal feed가 작동하지 않습니다<br />
                                <br />
                                <strong className="text-cyan-400/80">테스트 방법:</strong><br />
                                - 브라우저에서 이 URL을 열어보세요:<br />
                                <code className="text-xs text-cyan-300 break-all block mb-2 p-2 bg-black/40 rounded">https://calendar.google.com/calendar/ical/{calendar.calendarId || 'YOUR_ID'}/public/basic.ics</code><br />
                                - <strong className="text-green-400">캘린더 데이터가 보이면</strong> → 정상, 공개 설정 완료<br />
                                - <strong className="text-red-400">404 오류</strong> → 캘린더 ID가 잘못되었거나 공개 설정이 안 됨<br />
                                - <strong className="text-red-400">403 오류</strong> → 공개 설정 필요<br />
                                <br />
                                <strong className="text-red-400/80">⚠️ 404 오류 확인됨 - 해결 방법:</strong><br />
                                <br />
                                <strong className="text-yellow-400">404 오류는 캘린더를 찾을 수 없다는 의미입니다.</strong><br />
                                현재 ID: <code className="text-white/60">{calendar.calendarId || '(없음)'}</code><br />
                                <br />
                                <strong className="text-cyan-400">가장 확실한 해결 방법: 새 캘린더 만들기</strong><br />
                                <strong className="text-yellow-400">⚠️ "+ 만들기" 버튼이 아닙니다!</strong><br />
                                <br />
                                <strong className="text-green-400">올바른 방법:</strong><br />
                                1. Google Calendar 접속<br />
                                2. 왼쪽 사이드바에서 <strong>"내 캘린더"</strong> 섹션 찾기<br />
                                3. <strong>"내 캘린더"</strong> 옆에 있는 <strong>"+"</strong> 아이콘 클릭<br />
                                (또는 "내 캘린더" 제목 옆의 <strong>⋮</strong> (점 3개) 클릭)<br />
                                4. <strong>"새 캘린더 만들기"</strong> 또는 <strong>"캘린더 만들기"</strong> 선택<br />
                                5. 캘린더 이름 입력 (예: "포트폴리오 일정")<br />
                                6. 만들기<br />
                                7. 새로 만든 캘린더가 왼쪽 사이드바에 나타남<br />
                                8. 새 캘린더 이름 옆 <strong>⋮</strong> (점 3개) 클릭<br />
                                9. <strong>"설정 및 공유"</strong> 선택<br />
                                10. 아래로 스크롤하여 <strong>"공개 설정"</strong> 찾기<br />
                                11. <strong>"공개: 모든 세부정보 보기"</strong> 선택<br />
                                12. 저장<br />
                                13. 새 캘린더에 테스트 일정 추가 (이번 달)<br />
                                14. 설정 페이지에서 <strong>"캘린더 통합"</strong> 섹션의 <strong>"캘린더 ID"</strong> 복사<br />
                                15. 위에 새 캘린더 ID 입력 후 저장<br />
                                <br />
                                <strong className="text-red-400">💡 참고:</strong><br />
                                - "+ 만들기" 버튼은 일정을 만드는 버튼입니다<br />
                                - 새 캘린더를 만들려면 왼쪽 사이드바의 "내 캘린더" 섹션에서 + 아이콘을 사용하세요
                                <br />
                                <strong className="text-green-400">💡 왜 새 캘린더를 만들어야 하나요?</strong><br />
                                - 기본 캘린더(`zcan7898@gmail.com`)는 공개 설정이 제한적일 수 있습니다<br />
                                - 새 캘린더는 공개 설정이 쉽고 명확합니다<br />
                                - 테스트하기도 더 쉽습니다<br />
                                <br />
                                <strong className="text-yellow-400">현재 상태:</strong><br />
                                - API 키: {calendar.apiKey ? '✅ 입력됨' : '❌ 없음'}<br />
                                - 캘린더 ID: {calendar.calendarId || '❌ 없음'}<br />
                                - 오류: 404 Not Found (캘린더를 찾을 수 없음)
                                <br />
                                <strong className="text-red-400/80">현재 입력된 ID:</strong> <code className="text-white/60">{calendar.calendarId || '(없음)'}</code>
                            </p>
                        </div>
                        {/* 자동 연결 섹션 */}
                        <div className="p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 border-2 border-blue-500/30 rounded-lg">
                            <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <span className="text-green-400">✨</span> 자동 연결 (권장)
                            </h4>
                            <p className="text-sm text-white/70 mb-4">
                                Google Cloud Console에서 Client ID와 Client Secret만 입력하면, 버튼 클릭 한 번으로 자동으로 토큰을 받아서 저장합니다!
                            </p>
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                                <strong className="text-blue-400">📖 Client ID와 Client Secret 찾는 방법:</strong><br />
                                1. <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google Cloud Console</a> 접속<br />
                                2. 프로젝트 선택 → <strong>"API 및 서비스"</strong> → <strong>"사용자 인증 정보"</strong><br />
                                3. <strong>"OAuth 2.0 클라이언트 ID"</strong> 클릭<br />
                                4. <strong>"클라이언트 ID"</strong>와 <strong>"클라이언트 보안 비밀번호"</strong> 복사<br />
                                5. 아래 입력 필드에 붙여넣기<br />
                                <br />
                                <strong className="text-yellow-400">💡 상세 가이드:</strong> <code className="text-xs">GOOGLE_OAUTH_SETUP.md</code> 파일 참고
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1 flex items-center gap-2">
                                        OAuth 2.0 Client ID
                                        {(calendar?.oauthClientId) && (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                                                ✅ API 설정 완료
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={(calendar || {}).oauthClientId || ''}
                                        onChange={(e) => setCalendar({ ...(calendar || {}), oauthClientId: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        placeholder="OAuth 2.0 Client ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1 flex items-center gap-2">
                                        OAuth 2.0 Client Secret
                                        {(calendar?.oauthClientSecret) && (
                                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                                                ✅ API 설정 완료
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={(calendar || {}).oauthClientSecret || ''}
                                        onChange={(e) => setCalendar({ ...(calendar || {}), oauthClientSecret: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                        placeholder="OAuth 2.0 Client Secret"
                                    />
                                </div>
                                {/* 현재 사용되는 Redirect URI 표시 */}
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                                    <p className="text-blue-300 font-semibold mb-1">📍 현재 사용되는 Redirect URI:</p>
                                    <code className="text-blue-200 break-all">
                                        {typeof window !== 'undefined' ? `${window.location.origin}/api/calendar/callback` : 'http://localhost:3000/api/calendar/callback'}
                                    </code>
                                    <p className="text-yellow-300 mt-2 text-xs">
                                        ⚠️ 이 URI가 Google Cloud Console의 "승인된 리디렉션 URI"에 정확히 등록되어 있어야 합니다!
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const clientId = (calendar || {}).oauthClientId
                                        const clientSecret = (calendar || {}).oauthClientSecret

                                        if (!clientId || !clientSecret) {
                                            alert('❌ Client ID와 Client Secret을 먼저 입력해주세요.')
                                            return
                                        }

                                        // Google 인증 페이지로 리다이렉트
                                        const authUrl = `/api/calendar/auth?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`
                                        window.location.href = authUrl
                                    }}
                                    disabled={!(calendar || {}).oauthClientId || !(calendar || {}).oauthClientSecret}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded text-white font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <span className="text-xl">🔗</span>
                                    Google로 자동 연결하기
                                </button>
                                <p className="text-xs text-green-300 mt-2">
                                    ✅ 버튼을 클릭하면 Google 인증 페이지로 이동합니다. 권한을 승인하면 자동으로 토큰이 저장됩니다!
                                </p>
                            </div>
                        </div>

                        {/* 수동 입력 섹션 (기존 방식) */}
                        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                            <h4 className="text-sm font-bold text-yellow-400 mb-2">📝 수동 입력 (고급 사용자용)</h4>
                            <p className="text-xs text-white/50 mb-3">
                                OAuth 2.0 Playground에서 직접 토큰을 받아서 입력하는 방법입니다.
                            </p>
                            <div>
                                <label className="block text-sm text-white/60 mb-1 flex items-center gap-2">
                                    OAuth 2.0 Refresh Token (일정 등록용, 권장)
                                    {(calendar?.refreshToken) && (
                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                                            ✅ API 설정 완료
                                        </span>
                                    )}
                                    <span className="text-green-400 ml-2">⭐ 자동 갱신 가능!</span>
                                </label>
                                <input
                                    type="text"
                                    value={(calendar || {}).refreshToken || ''}
                                    onChange={(e) => setCalendar({ ...(calendar || {}), refreshToken: e.target.value })}
                                    className="w-full bg-black/20 border-2 border-green-500/50 rounded p-2 text-white focus:border-green-400"
                                    placeholder="OAuth 2.0 Playground에서 받은 Refresh token"
                                />
                                <p className="text-xs text-green-300 mt-1">
                                    ✅ Refresh Token을 입력하면 액세스 토큰이 만료되어도 자동으로 갱신됩니다! (권장)
                                </p>
                                <p className="text-xs text-white/50 mt-1">
                                    💡 OAuth 2.0 Playground의 Step 2에서 생성된 "Refresh token"을 복사하여 위에 붙여넣으세요
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1 flex items-center gap-2">
                                    OAuth 2.0 액세스 토큰 (일정 등록용, 선택사항)
                                    {(calendar?.accessToken) && (
                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                                            ✅ API 설정 완료
                                        </span>
                                    )}
                                    <span className="text-yellow-400 ml-2">Refresh Token이 없을 때만 사용</span>
                                </label>
                                <input
                                    type="text"
                                    value={(calendar || {}).accessToken || ''}
                                    onChange={(e) => setCalendar({ ...(calendar || {}), accessToken: e.target.value })}
                                    className="w-full bg-black/20 border border-yellow-500/30 rounded p-2 text-white"
                                    placeholder="OAuth 2.0 Playground에서 받은 Access token (Refresh Token이 있으면 자동 갱신됨)"
                                />
                                <p className="text-xs text-yellow-300 mt-1">
                                    ⚠️ 액세스 토큰은 1시간 후 만료됩니다. Refresh Token을 사용하는 것을 권장합니다.
                                </p>
                                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-200">
                                    <strong className="text-yellow-400">⚠️ invalid_scope 오류 해결 방법:</strong><br />
                                    <br />
                                    <strong className="text-green-400">✅ "OAuth 2.0 configuration" 패널이 열려있네요!</strong><br />
                                    <br />
                                    <strong className="text-cyan-400">이제 해야 할 일:</strong><br />
                                    1. 오른쪽에 열린 <strong>"OAuth 2.0 configuration"</strong> 패널을 보세요<br />
                                    2. 패널을 <strong>아래로 스크롤</strong>하세요<br />
                                    3. 패널 하단 부분에서 다음을 찾으세요:<br />
                                    - <strong>"OAuth flow"</strong> 드롭다운<br />
                                    - <strong>"OAuth endpoints"</strong> 드롭다운<br />
                                    - <strong>"Authorization endpoint"</strong> 입력 필드<br />
                                    - <strong>"Token endpoint"</strong> 입력 필드<br />
                                    - <strong>"Access token location"</strong> 드롭다운<br />
                                    - <strong>"Access type"</strong> 드롭다운<br />
                                    - <strong>"Force prompt"</strong> 드롭다운<br />
                                    - <strong className="text-yellow-300">"Use your own OAuth credentials"</strong> ← 이 체크박스를 찾으세요!<br />
                                    4. <strong>"Use your own OAuth credentials"</strong> 체크박스에 체크하세요<br />
                                    5. 체크하면 <strong>"OAuth Client ID"</strong>와 <strong>"OAuth Client secret"</strong> 입력 필드가 나타납니다<br />
                                    6. Google Cloud Console에서 생성한 값들을 입력하세요<br />
                                    <br />
                                    <strong className="text-red-400">💡 여전히 보이지 않나요?</strong><br />
                                    - 패널을 <strong>맨 아래까지</strong> 스크롤해보세요<br />
                                    - 패널이 작게 보이면 브라우저 확대/축소를 조정해보세요<br />
                                    - "Close" 버튼 위에 있을 수 있습니다
                                </div>
                                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-200">
                                    <strong className="text-green-400">✅ Google Calendar API가 이미 활성화되어 있습니다!</strong><br />
                                    <br />
                                    <strong className="text-yellow-400">이제 OAuth 2.0 Playground에서 토큰을 발급받으세요:</strong><br />
                                    <br />
                                    <strong className="text-cyan-400">Step 1: 스코프 직접 입력 (중요!)</strong><br />
                                    <strong className="text-red-400">⚠️ API 목록에서 검색하지 마세요!</strong><br />
                                    1. OAuth 2.0 Playground 왼쪽 패널로 이동<br />
                                    2. <strong>"Step 1 Select & authorize APIs"</strong> 섹션을 <strong>확장</strong>하세요 (▶ 클릭)<br />
                                    3. API 목록을 스크롤하여 <strong>"Input your own scopes"</strong> 입력 필드 찾기<br />
                                    (API 목록 아래에 있습니다)<br />
                                    4. 다음 스코프를 <strong>직접 입력</strong>하세요:<br />
                                    <code className="text-xs text-cyan-300 block p-2 bg-black/40 rounded mt-1 break-all">https://www.googleapis.com/auth/calendar</code><br />
                                    5. <strong>"Authorize APIs"</strong> 버튼 클릭<br />
                                    6. Google 계정 선택 및 권한 승인<br />
                                    7. 승인 후 <strong>"Authorization code"</strong>가 생성됩니다<br />
                                    <br />
                                    <strong className="text-cyan-400">Step 2: 토큰 교환</strong><br />
                                    1. <strong>"Step 2 Exchange authorization code for tokens"</strong> 섹션을 <strong>확장</strong>하세요 (▶ 클릭)<br />
                                    2. <strong>"Exchange authorization code for tokens"</strong> 버튼 클릭<br />
                                    3. <strong>"Access token"</strong> 필드에 토큰이 생성됩니다<br />
                                    4. <strong className="text-yellow-300">이 토큰을 복사하세요!</strong><br />
                                    <br />
                                    <strong className="text-red-400">❌ Step 3은 필요 없습니다!</strong><br />
                                    <strong className="text-white">→ Step 3 "Configure request to API"는 건너뛰셔도 됩니다</strong><br />
                                    <strong className="text-white">→ Step 2에서 받은 Access Token만 있으면 충분합니다</strong><br />
                                    <br />
                                    <strong className="text-yellow-400">📍 토큰 등록 위치:</strong><br />
                                    <strong className="text-white">→ 이 입력 필드 바로 위에 있는 "OAuth 2.0 액세스 토큰" 필드에 붙여넣으세요!</strong><br />
                                    <strong className="text-white">→ 그 다음 아래로 스크롤하여 "캘린더 설정 저장" 버튼을 클릭하세요!</strong><br />
                                    <br />
                                    <strong className="text-red-400">⚠️ "invalid_grant" 오류 해결:</strong><br />
                                    - <strong>Authorization code가 만료되었거나 이미 사용됨</strong><br />
                                    → Step 1을 다시 진행하세요<br />
                                    → "Authorize APIs" 버튼을 다시 클릭하여 새로운 Authorization code 받기<br />
                                    → 새로 받은 code로 Step 2 다시 시도<br />
                                    - <strong>OAuth Client ID/Secret이 잘못됨</strong><br />
                                    → 오른쪽 "OAuth 2.0 configuration" 패널에서 Client ID와 Secret 확인<br />
                                    → Google Cloud Console에서 생성한 값과 정확히 일치하는지 확인<br />
                                    - <strong>Redirect URI 불일치</strong><br />
                                    → Google Cloud Console에서 OAuth Client ID 설정 확인<br />
                                    → 승인된 리디렉션 URI에 <code className="text-xs">https://developers.google.com/oauthplayground</code> 추가<br />
                                    - <strong>스코프 문제</strong><br />
                                    → Step 1에서 스코프를 정확히 입력했는지 확인<br />
                                    → 공백 없이 <code className="text-xs">https://www.googleapis.com/auth/calendar</code> 입력<br />
                                </div>
                                <p className="text-xs text-white/40 mt-2 space-y-1">
                                    <strong className="text-white/60">토큰 발급 방법 (단계별):</strong><br />
                                    <br />
                                    <strong className="text-yellow-400">1단계: OAuth 2.0 Playground 설정</strong><br />
                                    <strong className="text-green-400">✅ "OAuth 2.0 configuration" 패널이 이미 열려있습니다!</strong><br />
                                    <br />
                                    <strong className="text-cyan-400">이제 해야 할 일:</strong><br />
                                    1. 오른쪽에 열린 <strong>"OAuth 2.0 configuration"</strong> 패널을 확인하세요<br />
                                    2. 패널 내용을 <strong>아래로 스크롤</strong>하세요<br />
                                    3. 패널에서 다음 항목들을 순서대로 찾으세요:<br />
                                    - OAuth flow (드롭다운)<br />
                                    - OAuth endpoints (드롭다운)<br />
                                    - Authorization endpoint (입력 필드)<br />
                                    - Token endpoint (입력 필드)<br />
                                    - Access token location (드롭다운)<br />
                                    - Access type (드롭다운)<br />
                                    - Force prompt (드롭다운)<br />
                                    - <strong className="text-yellow-300">"Use your own OAuth credentials"</strong> ← 이 체크박스!<br />
                                    4. <strong>"Use your own OAuth credentials"</strong> 체크박스를 찾아서 체크하세요<br />
                                    (체크박스는 패널의 하단 부분, "Close" 버튼 바로 위에 있습니다)<br />
                                    5. 체크하면 바로 아래에 입력 필드 2개가 나타납니다:<br />
                                    - <strong>"OAuth Client ID"</strong> 입력 필드<br />
                                    - <strong>"OAuth Client secret"</strong> 입력 필드<br />
                                    6. Google Cloud Console에서 생성한 값들을 입력하세요<br />
                                    <br />
                                    <strong className="text-red-400">💡 여전히 보이지 않나요?</strong><br />
                                    - 패널을 <strong>맨 아래까지</strong> 스크롤해보세요 (스크롤바가 있을 수 있습니다)<br />
                                    - "Close" 버튼을 찾으세요 - 체크박스는 그 바로 위에 있습니다<br />
                                    - 브라우저 확대/축소를 조정해보세요 (Ctrl + 마우스 휠)<br />
                                    - 패널이 작게 보이면 브라우저 창을 넓혀보세요
                                    <br />
                                    <strong className="text-yellow-400">2단계: OAuth Client ID 생성 (처음 한 번만)</strong><br />
                                    1. <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google Cloud Console</a> 접속<br />
                                    2. 프로젝트 선택 또는 생성<br />
                                    3. <strong>"API 및 서비스" → "사용자 인증 정보"</strong><br />
                                    4. <strong>"사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"</strong><br />
                                    5. 애플리케이션 유형: <strong>"웹 애플리케이션"</strong> 선택<br />
                                    6. 승인된 리디렉션 URI에 추가:<br />
                                    <code className="text-xs text-cyan-300 block p-1 bg-black/40 rounded mt-1">https://developers.google.com/oauthplayground</code><br />
                                    7. 생성 후 <strong>클라이언트 ID</strong>와 <strong>클라이언트 보안 비밀</strong> 복사<br />
                                    <br />
                                    <strong className="text-yellow-400">3단계: Google Cloud Console에서 Calendar API 활성화 (필수!)</strong><br />
                                    <strong className="text-red-400">⚠️ 이 단계를 먼저 해야 합니다!</strong><br />
                                    1. <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google Calendar API 활성화 페이지</a>로 이동<br />
                                    2. 프로젝트 선택 (OAuth Client ID를 만든 프로젝트와 동일한 프로젝트)<br />
                                    3. <strong>"사용 설정"</strong> 또는 <strong>"Enable"</strong> 버튼 클릭<br />
                                    4. API가 활성화될 때까지 대기 (몇 초 소요)<br />
                                    <br />
                                    <strong className="text-yellow-400">4단계: 토큰 발급</strong><br />
                                    <strong className="text-red-400">⚠️ Calendar API가 활성화되어 있어야 합니다!</strong><br />
                                    1. OAuth 2.0 Playground로 돌아가기<br />
                                    2. 왼쪽 패널에서 <strong>"Input your own scopes"</strong> 입력 필드 찾기<br />
                                    (API 목록 아래에 있습니다)<br />
                                    3. 다음 스코프를 <strong>직접 입력</strong>하세요:<br />
                                    <code className="text-xs text-cyan-300 block p-2 bg-black/40 rounded mt-1 break-all">https://www.googleapis.com/auth/calendar</code><br />
                                    또는<br />
                                    <code className="text-xs text-cyan-300 block p-2 bg-black/40 rounded mt-1 break-all">https://www.googleapis.com/auth/calendar.events</code><br />
                                    4. <strong>"Authorize APIs"</strong> 버튼 클릭<br />
                                    5. Google 계정 선택 및 권한 승인<br />
                                    6. <strong>"Step 2"</strong>로 이동<br />
                                    7. <strong>"Exchange authorization code for tokens"</strong> 버튼 클릭<br />
                                    8. 생성된 <strong>"Access token"</strong> 복사하여 위에 입력<br />
                                    <br />
                                    <strong className="text-red-400">⚠️ 오류 해결:</strong><br />
                                    - <strong>"invalid_scope" 또는 "400 오류: invalid_scope"</strong> 오류:<br />
                                    → <strong>가장 중요:</strong> Google Cloud Console에서 <strong>Calendar API를 활성화</strong>해야 합니다!<br />
                                    → <a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Calendar API 활성화 링크</a><br />
                                    → OAuth Client ID를 만든 프로젝트와 동일한 프로젝트를 선택하세요<br />
                                    → API 목록에서 검색하지 말고, <strong>"Input your own scopes"</strong> 필드에 직접 입력하세요<br />
                                    → 올바른 스코프: <code className="text-xs">https://www.googleapis.com/auth/calendar</code><br />
                                    - <strong>"Calendar 검색이 안 됨"</strong> 문제:<br />
                                    → API 목록에서 검색하지 마세요!<br />
                                    → <strong>"Input your own scopes"</strong> 입력 필드를 사용하세요<br />
                                    → 스코프를 직접 입력하면 됩니다<br />
                                    - <strong>"redirect_uri_mismatch"</strong> 오류: 리디렉션 URI가 일치하지 않습니다<br />
                                    - <strong>"access_denied"</strong> 오류: 권한을 승인하지 않았습니다<br />
                                    <br />
                                    <strong className="text-yellow-400">⚠️ 참고:</strong><br />
                                    - 액세스 토큰은 1시간 후 만료됩니다<br />
                                    - 영구적으로 사용하려면 Refresh Token을 사용하거나 Service Account를 설정하세요<br />
                                    - 토큰은 안전하게 보관하세요
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">API 키 (일정 조회용, 선택사항)</label>
                            <input
                                type="text"
                                value={calendar.apiKey || ''}
                                onChange={(e) => setCalendar({ ...calendar, apiKey: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white"
                                placeholder="Google Calendar API 키 (더 많은 기능을 위해)"
                            />
                            <p className="text-xs text-white/40 mt-2 space-y-1">
                                <strong className="text-white/60">API 키 생성 및 설정 방법:</strong><br />
                                1. Google Cloud Console 접속 (https://console.cloud.google.com)<br />
                                2. 프로젝트 선택 또는 새 프로젝트 생성<br />
                                3. <strong>"API 및 서비스" → "라이브러리"</strong><br />
                                4. <strong>"Google Calendar API"</strong> 검색 후 <strong className="text-yellow-400">반드시 활성화</strong><br />
                                5. <strong>"API 및 서비스" → "사용자 인증 정보"</strong><br />
                                6. <strong>"사용자 인증 정보 만들기" → "API 키"</strong><br />
                                7. 생성된 API 키 클릭하여 편집<br />
                                8. <strong className="text-yellow-400">"API 제한사항"</strong>에서:<br />
                                - <strong>"키 제한"</strong> 선택<br />
                                - <strong>"API 선택"</strong> 선택<br />
                                - <strong>"Google Calendar API"</strong> 체크<br />
                                - 저장<br />
                                9. API 키 복사하여 아래에 입력<br />
                                <br />
                                <strong className="text-red-400/80">⚠️ 오류율 100% 해결 방법:</strong><br />
                                <strong className="text-yellow-400">Google Cloud Console에서 확인:</strong><br />
                                1. <strong>"API 및 서비스" → "사용 설정된 API 및 서비스"</strong>에서<br />
                                - <strong>"Google Calendar API"</strong> 클릭<br />
                                - <strong>"메트릭"</strong> 또는 <strong>"오류"</strong> 탭 확인<br />
                                - 어떤 에러가 발생하는지 확인<br />
                                <br />
                                2. <strong>"사용자 인증 정보"</strong>에서 API 키 확인:<br />
                                - API 키 클릭하여 편집<br />
                                - <strong>"API 제한사항"</strong> 확인<br />
                                - <strong>"키 제한 안함"</strong> 또는 <strong>"Google Calendar API"</strong> 체크 확인<br />
                                <br />
                                3. <strong>"API 및 서비스" → "라이브러리"</strong>에서:<br />
                                - <strong>"Google Calendar API"</strong> 검색<br />
                                - <strong>"활성화"</strong> 상태인지 확인<br />
                                <br />
                                <strong className="text-cyan-400">현재 상태:</strong><br />
                                - API 키: {calendar.apiKey ? '✅ 입력됨' : '❌ 없음'}<br />
                                - 캘린더 ID: {calendar.calendarId || '❌ 없음'}<br />
                                <br />
                                <strong className="text-red-400">🔍 서버 콘솔에서 확인:</strong><br />
                                - <code className="text-cyan-300">[Calendar API] ====== GOOGLE API RESPONSE ======</code><br />
                                - <code className="text-cyan-300">[Calendar API] Full error object:</code><br />
                                - 이 로그에서 정확한 에러 메시지를 확인하세요!
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                const calendarData = calendar || {};
                                console.log('[Admin] Saving calendar data:', calendarData);
                                if (!calendarData.calendarId && !calendarData.apiKey && !calendarData.oauthClientId && !calendarData.oauthClientSecret && !calendarData.accessToken) {
                                    alert('저장할 데이터가 없습니다. 최소한 하나의 필드를 입력해주세요.');
                                    return;
                                }
                                handleUpdate('calendar', calendarData);
                            }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold"
                        >
                            캘린더 설정 저장
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderSocials = () => {
        const addSocial = () => {
            setSocials([...socials, { id: `social_${Date.now()}`, name: '', icon: 'Link', url: '', color: 'hover:text-white' }])
        }
        const removeSocial = (idx: number) => {
            setSocials(socials.filter((_, i) => i !== idx))
        }

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-pink-400" /> 소셜 링크 목록
                    </h3>
                    <button onClick={addSocial} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded text-white text-sm flex items-center gap-1">
                        <Plus className="w-4 h-4" /> 추가
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socials.map((social, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    placeholder="이름 (예: GitHub)"
                                    value={social.name}
                                    onChange={(e) => {
                                        const newSocials = [...socials]
                                        newSocials[idx].name = e.target.value
                                        setSocials(newSocials)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                                <input
                                    placeholder="아이콘 이름 (Lucide 아이콘, 예: Github, Linkedin)"
                                    value={social.icon}
                                    onChange={(e) => {
                                        const newSocials = [...socials]
                                        newSocials[idx].icon = e.target.value
                                        setSocials(newSocials)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                                <input
                                    placeholder="URL (https://...)"
                                    value={social.url}
                                    onChange={(e) => {
                                        const newSocials = [...socials]
                                        newSocials[idx].url = e.target.value
                                        setSocials(newSocials)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                                <input
                                    placeholder="색상 클래스 (예: hover:text-blue-400)"
                                    value={social.color}
                                    onChange={(e) => {
                                        const newSocials = [...socials]
                                        newSocials[idx].color = e.target.value
                                        setSocials(newSocials)
                                    }}
                                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                                />
                            </div>
                            <button onClick={() => removeSocial(idx)} className="text-red-400 text-sm hover:underline flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> 삭제
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => handleUpdate('socials', socials)}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-500 rounded text-white font-bold"
                >
                    소셜 링크 저장
                </button>
            </div>
        )
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center text-white">로딩 중...</div>
    }

    return (
        <main className="min-h-screen bg-background text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/30 px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-cyan-400">Admin Panel</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowErrorConsole(!showErrorConsole)}
                        className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${showErrorConsole
                            ? 'bg-red-600 hover:bg-red-500'
                            : errorLogs.length > 0
                                ? 'bg-yellow-600 hover:bg-yellow-500'
                                : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                    >
                        <Terminal className="w-4 h-4" />
                        에러 로그 {errorLogs.length > 0 && `(${errorLogs.length})`}
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white flex items-center gap-2 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        메인 포트폴리오로
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/10 bg-black/20 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold mb-8 text-white/80">메뉴</h2>

                    <nav className="space-y-2 flex-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <User className="w-5 h-5" /> 프로필
                        </button>
                        <button
                            onClick={() => setActiveTab('experience')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'experience' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Briefcase className="w-5 h-5" /> 경력
                        </button>
                        <button
                            onClick={() => setActiveTab('skills')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'skills' ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Code className="w-5 h-5" /> 기술 스택
                        </button>
                        <button
                            onClick={() => setActiveTab('certifications')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'certifications' ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Award className="w-5 h-5" /> 자격증
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'projects' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Folder className="w-5 h-5" /> 프로젝트
                        </button>
                        <button
                            onClick={() => setActiveTab('blog')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'blog' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <BookOpen className="w-5 h-5" /> 블로그
                        </button>
                        <button
                            onClick={() => setActiveTab('publications')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'publications' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Book className="w-5 h-5" /> 대표 저서
                        </button>
                        <button
                            onClick={() => setActiveTab('socials')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'socials' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <Share2 className="w-5 h-5" /> 소셜 링크
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'calendar' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5 text-white/60'}`}
                        >
                            <CalendarIcon className="w-5 h-5" /> 구글 캘린더
                        </button>
                    </nav>
                </aside>

                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold mb-8 capitalize">
                            {activeTab === 'profile' && '프로필 관리'}
                            {activeTab === 'experience' && '경력 관리'}
                            {activeTab === 'skills' && '기술 스택 관리'}
                            {activeTab === 'certifications' && '자격증 관리'}
                            {activeTab === 'projects' && '프로젝트 관리'}
                            {activeTab === 'blog' && '블로그 설정'}
                            {activeTab === 'publications' && '대표 저서 관리'}
                            {activeTab === 'socials' && '소셜 링크 관리'}
                            {activeTab === 'calendar' && '구글 캘린더 설정'}
                        </h2>

                        {activeTab === 'profile' && renderProfile()}
                        {activeTab === 'experience' && renderExperience()}
                        {activeTab === 'skills' && renderSkills()}
                        {activeTab === 'certifications' && renderCertifications()}
                        {activeTab === 'projects' && renderProjects()}
                        {activeTab === 'blog' && renderBlog()}
                        {activeTab === 'publications' && renderPublications()}
                        {activeTab === 'socials' && renderSocials()}
                        {activeTab === 'calendar' && renderCalendar()}
                    </div>
                </div>
            </div>

            {/* Publication Preview Dialog */}
            <Dialog open={!!previewPublication} onOpenChange={(open) => !open && setPreviewPublication(null)}>
                <DialogContent className="max-w-6xl sm:max-w-6xl bg-zinc-900 border-zinc-800 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold">도서 상세 정보</DialogTitle>
                    </DialogHeader>
                    {previewPublication ? (
                        <div className="mt-4">
                            <div
                                className="relative overflow-hidden rounded-3xl glass-card p-6 duration-300 h-full border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors group"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-10 h-full relative">
                                    {/* 3D Book Cover */}
                                    <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                                        {previewPublication.image ? (
                                            <div className="w-72 h-[27rem] rounded-r-md rounded-l-sm shadow-2xl overflow-hidden relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                                                <Image
                                                    src={previewPublication.image}
                                                    alt={previewPublication.title || 'Publication'}
                                                    width={600}
                                                    height={800}
                                                    quality={100}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-72 h-[27rem] bg-gradient-to-br from-amber-400 to-orange-600 rounded-r-md rounded-l-sm shadow-2xl flex items-center justify-center relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                                                <div className="absolute inset-y-0 left-0 w-1 bg-white/20" />
                                                <div className="text-center p-4">
                                                    <div className="text-xs font-bold text-amber-900 tracking-widest mb-2">
                                                        {previewPublication.tag || "NEW BOOK"}
                                                    </div>
                                                    <h3 className="text-white font-bold text-xl leading-tight whitespace-pre-line">
                                                        {previewPublication.title || '제목 없음'}
                                                    </h3>
                                                </div>
                                            </div>
                                        )}
                                        {/* Book Pages Effect */}
                                        <div className="absolute top-1 right-2 w-72 h-[26rem] bg-white/90 rounded-r-md z-0 transform translate-x-2 translate-y-1 shadow-md" />
                                        <div className="absolute top-2 right-4 w-72 h-[25rem] bg-white/80 rounded-r-md -z-10 transform translate-x-4 translate-y-2 shadow-sm" />
                                    </div>

                                    <div className="flex flex-col justify-center text-center sm:text-left flex-1">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                                                {previewPublication.tag || "대표 저서"}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                                            {previewPublication.title || '(제목 없음)'}
                                        </h3>

                                        <p className="text-zinc-400 text-sm mb-4 leading-relaxed break-words whitespace-pre-line">
                                            {previewPublication.description || '(설명 없음)'}
                                        </p>

                                        {/* 구매 링크 버튼들 - Store Grid Style */}
                                        {(previewPublication.purchaseLinks && previewPublication.purchaseLinks.length > 0) ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto pt-4 border-t border-white/5">
                                                {previewPublication.purchaseLinks.map((link: any, linkIdx: number) => {
                                                    return (
                                                        <a
                                                            key={linkIdx}
                                                            href={link.url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 px-4 py-4 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/20 hover:border-amber-500/50 text-zinc-200 rounded-xl transition-all group/btn"
                                                        >
                                                            <div className={`p-2 rounded-lg ${getStoreColor(link.name)}/10 text-white group-hover/btn:${getStoreColor(link.name)} transition-colors`}>
                                                                <StoreLogo store={link.name || ''} className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Buy at</span>
                                                                <span className="font-bold text-amber-100 group-hover/btn:text-white">{link.name || '구매하기'}</span>
                                                            </div>
                                                            <ExternalLink className="w-4 h-4 ml-auto opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        ) : previewPublication.link && !previewPublication.link.startsWith('#') ? (
                                            <div className="mt-auto pt-4 border-t border-white/5">
                                                <a
                                                    href={previewPublication.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 px-4 py-4 border border-green-500/20 bg-green-500/5 hover:bg-green-500/20 hover:border-green-500/50 text-zinc-200 rounded-xl transition-all group/btn w-full sm:w-1/2"
                                                >
                                                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover/btn:bg-green-500 group-hover/btn:text-white transition-colors">
                                                        <Book className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Preview</span>
                                                        <span className="font-bold text-green-100 group-hover/btn:text-white">미리보기</span>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 ml-auto opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-white/50">
                            로딩 중...
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Error Log Console */}
            {showErrorConsole && (
                <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-red-500/50 z-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between p-4 border-b border-red-500/30">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <h3 className="text-lg font-bold text-red-400">에러 로그 콘솔</h3>
                                <span className="text-sm text-white/60">({errorLogs.length}개)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setErrorLogs([])}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm"
                                >
                                    로그 지우기
                                </button>
                                <button
                                    onClick={() => setShowErrorConsole(false)}
                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto p-4">
                            {errorLogs.length === 0 ? (
                                <div className="text-center text-white/60 py-8">
                                    에러 로그가 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {errorLogs.map((log, idx) => (
                                        <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs text-red-400 font-mono">{log.timestamp}</span>
                                                <span className="text-xs text-white/40">#{errorLogs.length - idx}</span>
                                            </div>
                                            <div className="text-white font-semibold mb-1">{log.message}</div>
                                            {log.details && (
                                                <details className="mt-2">
                                                    <summary className="text-sm text-white/60 cursor-pointer hover:text-white/80">
                                                        상세 정보 보기
                                                    </summary>
                                                    <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-red-300 font-mono overflow-x-auto">
                                                        {log.details}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
