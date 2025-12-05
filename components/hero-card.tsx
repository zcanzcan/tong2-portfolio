'use client'

import { useEffect, useState } from "react"
import { SpotlightCard } from "@/components/spotlight-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Download, Mail, Coffee, ExternalLink, Lock } from 'lucide-react'
import { useRouter } from "next/navigation"
import Image from "next/image"
import * as Icons from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function HeroCard() {
  const [data, setData] = useState<any>(null)
  const [roleIndex, setRoleIndex] = useState(0)
  const [text, setText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [titleText, setTitleText] = useState("")
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [adminId, setAdminId] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()
  const { language } = useLanguage()

  const handleAdminLogin = async () => {
    setShowLoginDialog(true)
    setLoginError("")
    setAdminId("")
    setAdminPassword("")
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoggingIn(true)

    if (!adminId || !adminPassword) {
      setLoginError("ID와 비밀번호를 입력해주세요.")
      setIsLoggingIn(false)
      return
    }

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, password: adminPassword })
      })
      const data = await res.json()

      if (data.success) {
        setShowLoginDialog(false)
        router.push('/admin')
      } else {
        setLoginError(data.message || 'ID 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch (e) {
      setLoginError('오류가 발생했습니다.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
  }, [])

  // Title typing animation
  useEffect(() => {
    const title = language === 'ko'
      ? data?.profile?.title
      : data?.profile?.titleEn || data?.profile?.title

    if (!title) {
      setTitleText("")
      return
    }

    const timeout = setTimeout(() => {
      if (titleText.length < title.length) {
        setTitleText(title.substring(0, titleText.length + 1))
      } else if (titleText.length > title.length) {
        setTitleText(title)
      }
    }, 100)

    return () => clearTimeout(timeout)
  }, [titleText, data, language])

  // Roles typing animation (fallback if no title)
  useEffect(() => {
    const title = language === 'ko'
      ? data?.profile?.title
      : data?.profile?.titleEn || data?.profile?.title

    if (title || !data?.profile?.roles) return

    const roles = language === 'ko'
      ? data.profile.roles
      : (data.profile.rolesEn || data.profile.roles)

    if (!roles || roles.length === 0) return

    const currentRole = roles[roleIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentRole.substring(0, text.length + 1))
        if (text.length === currentRole.length) {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        setText(currentRole.substring(0, text.length - 1))
        if (text.length === 0) {
          setIsDeleting(false)
          setRoleIndex((prev) => (prev + 1) % roles.length)
        }
      }
    }, isDeleting ? 50 : 150)

    return () => clearTimeout(timeout)
  }, [text, isDeleting, roleIndex, data, language])

  if (!data || !data.profile) return <SpotlightCard className="h-full animate-pulse bg-white/5" spotlightColor="transparent"><div /></SpotlightCard>

  const { profile, heroButtons } = data

  // Get localized data
  const getLocalized = (ko: string, en?: string) => {
    return language === 'ko' ? ko : (en || ko)
  }

  const profileName = getLocalized(profile.name, profile.nameEn)
  const profileTitle = getLocalized(profile.title, profile.titleEn)
  const profileBio = getLocalized(profile.bio, profile.bioEn)
  const profileStatus = getLocalized(profile.status, profile.statusEn)
  const localizedHeroButtons = heroButtons?.map((btn: any) => ({
    ...btn,
    text: getLocalized(btn.text, btn.textEn)
  }))

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || ExternalLink
    return <Icon className="w-4 h-4 mr-2" />
  }

  return (
    <SpotlightCard className="h-full flex flex-col justify-between group">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl shadow-cyan-500/20">
            <Image
              src={profile.image || "/placeholder.svg"}
              alt="Profile"
              width={128}
              height={128}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            {profileStatus}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {profileName}
          </h1>
          <div className="h-6">
            {profileTitle ? (
              <>
                <span className="text-lg text-white/60 font-mono">{language === 'ko' ? '저는 ' : 'I am '}</span>
                <span className="text-lg text-cyan-400 font-mono font-bold">{titleText}</span>
                {titleText.length < profileTitle.length && (
                  <span className="animate-blink text-cyan-400">|</span>
                )}
              </>
            ) : profile.roles && profile.roles.length > 0 ? (
              <>
                <span className="text-lg text-white/60 font-mono">{language === 'ko' ? '저는 ' : 'I am '}</span>
                <span className="text-lg text-cyan-400 font-mono font-bold">{text}</span>
                <span className="animate-blink text-cyan-400">|</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <p className="text-white/70 leading-relaxed max-w-xl whitespace-pre-line">
          {profileBio}
        </p>

        <div className="flex flex-wrap gap-4">
          {localizedHeroButtons?.map((btn: any, i: number) => {
            const hasDropdown = btn.dropdownItems && btn.dropdownItems.length > 0

            if (hasDropdown) {
              return (
                <DropdownMenu key={i}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={btn.variant === 'primary' ? 'default' : 'outline'}
                      className={`rounded-full px-6 min-h-[44px] ${btn.variant === 'primary'
                        ? 'bg-white text-black hover:bg-cyan-50 hover:text-cyan-900'
                        : btn.variant === 'outline-amber'
                          ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400'
                          : 'border-white/10 text-white hover:bg-white/5 hover:text-cyan-400'
                        }`}
                    >
                      {getIcon(btn.icon)}
                      {btn.text}
                      <Icons.ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white min-w-[200px]">
                    {btn.dropdownItems.map((item: any, idx: number) => (
                      <DropdownMenuItem key={idx} asChild className="focus:bg-white/10 focus:text-cyan-400 cursor-pointer">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                          <Download className="w-4 h-4 mr-2" />
                          {item.text}
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Button
                key={i}
                variant={btn.variant === 'primary' ? 'default' : 'outline'}
                className={`rounded-full px-6 min-h-[44px] ${btn.variant === 'primary'
                  ? 'bg-white text-black hover:bg-cyan-50 hover:text-cyan-900'
                  : btn.variant === 'outline-amber'
                    ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400'
                    : 'border-white/10 text-white hover:bg-white/5 hover:text-cyan-400'
                  }`}
                asChild
              >
                <a href={btn.url} target={btn.url.startsWith('http') ? '_blank' : undefined}>
                  {getIcon(btn.icon)}
                  {btn.text}
                </a>
              </Button>
            )
          })}

          {/* Admin Login Button */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-30 hover:opacity-100 transition-opacity duration-300 w-10 h-10 border border-white/10 hover:border-white/30"
            onClick={handleAdminLogin}
            title="관리자 로그인"
          >
            <Lock className="w-4 h-4" />
            <span className="sr-only">Admin Login</span>
          </Button>
        </div>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="bg-black/95 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              관리자 로그인
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin-id" className="text-white/80">Admin ID</Label>
              <Input
                id="admin-id"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="관리자 ID를 입력하세요"
                className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
                autoFocus
                disabled={isLoggingIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-white/80">비밀번호</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
                disabled={isLoggingIn}
              />
            </div>
            {loginError && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
                {loginError}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLoginDialog(false)}
                className="flex-1 border-white/10 text-white hover:bg-white/5"
                disabled={isLoggingIn}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? '로그인 중...' : '로그인'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </SpotlightCard>
  )
}
