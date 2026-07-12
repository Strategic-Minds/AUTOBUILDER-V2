'use client'

import { Project, Task, Receipt, ValidationCheck, AppSettings } from './types'

const STORAGE_KEY = 'auto-builder-os-data'
const SETTINGS_KEY = 'auto-builder-os-settings'

interface StorageData {
  projects: Project[]
  validationChecks: ValidationCheck[]
  lastUpdated: string
}

const DEFAULT_SETTINGS: AppSettings = {
  googleDriveFolderId: '',
  githubRepo: '',
  vercelProject: '',
  supabaseProject: '',
  gptBusinessWorkspace: '',
  aiGatewayModel: 'gpt-4',
  cronEndpoint: '',
  notificationEmail: '',
  brandDefaults: {
    defaultBrandPack: 'modern-conversion',
    defaultDesign: 'high-converting-lead-funnel',
    defaultWorkflow: 'simple-lead-capture'
  },
  mode: 'demo',
  // Base44
  base44AgentUrl: 'https://app.base44.com/clone-superagent-template/KX4HpgFpcRqyxf9TTi3gxq0f-YaMDh7o',
  base44ApiKey: '',
  base44ProjectId: '',
  base44Enabled: false,
  // WhatsApp
  whatsappEnabled: false,
  whatsappPhoneNumberId: '',
  whatsappAccessToken: '',
  whatsappWebhookSecret: '',
  whatsappBusinessAccountId: '',
  // Slack
  slackEnabled: false,
  slackBotToken: '',
  slackAppToken: '',
  slackDefaultChannel: '#auto-builder',
  slackWebhookUrl: '',
  slackSigningSecret: '',
  // Notifications
  alertsToSlack: true,
  alertsToWhatsapp: false,
  buildNotifications: true,
  validationAlerts: true,
  approvalRequests: true,
  dailyBriefEnabled: true,
  dailyBriefTime: '08:00',
}

// Safe storage for SSR
const isBrowser = typeof window !== 'undefined'

export function getStorage(): StorageData {
  if (!isBrowser) {
    return { projects: [], validationChecks: [], lastUpdated: new Date().toISOString() }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { projects: [], validationChecks: [], lastUpdated: new Date().toISOString() }
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error('[v0] Storage read error:', error)
    return { projects: [], validationChecks: [], lastUpdated: new Date().toISOString() }
  }
}

export function saveStorage(data: StorageData): void {
  if (!isBrowser) return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }))
  } catch (error) {
    console.error('[v0] Storage save error:', error)
  }
}

export function getProjects(): Project[] {
  const data = getStorage()
  return data.projects || []
}

export function getProject(id: string): Project | null {
  const projects = getProjects()
  return projects.find(p => p.id === id) || null
}

export function saveProjects(projects: Project[]): void {
  const data = getStorage()
  saveStorage({ ...data, projects })
}

export function createProject(project: Project): Project {
  const projects = getProjects()
  const updated = [...projects, project]
  saveProjects(updated)
  return project
}

// Alias for createProject for backwards compatibility
export const addProject = createProject

export function updateProject(projectId: string, updates: Partial<Project>): Project | null {
  const projects = getProjects()
  const index = projects.findIndex(p => p.id === projectId)
  
  if (index === -1) return null
  
  const updated = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  projects[index] = updated
  saveProjects(projects)
  
  return updated
}

export function deleteProject(projectId: string): boolean {
  const projects = getProjects()
  const filtered = projects.filter(p => p.id !== projectId)
  
  if (filtered.length === projects.length) return false
  
  saveProjects(filtered)
  return true
}

export function addTask(projectId: string, task: Task): Task | null {
  const project = getProject(projectId)
  if (!project) return null
  
  const updated = {
    ...project,
    tasks: [...(project.tasks || []), task],
    updatedAt: new Date().toISOString()
  }
  
  updateProject(projectId, updated)
  return task
}

export function updateTask(projectId: string, taskId: string, updates: Partial<Task>): Task | null {
  const project = getProject(projectId)
  if (!project) return null
  
  const tasks = project.tasks || []
  const index = tasks.findIndex(t => t.id === taskId)
  
  if (index === -1) return null
  
  const updated = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  tasks[index] = updated
  
  updateProject(projectId, { ...project, tasks })
  
  return updated
}

export function deleteTask(projectId: string, taskId: string): boolean {
  const project = getProject(projectId)
  if (!project) return false
  
  const tasks = project.tasks || []
  const filtered = tasks.filter(t => t.id !== taskId)
  
  if (filtered.length === tasks.length) return false
  
  updateProject(projectId, { ...project, tasks: filtered })
  return true
}

export function addReceipt(projectId: string, receipt: Receipt): Receipt | null {
  const project = getProject(projectId)
  if (!project) return null
  
  const updated = {
    ...project,
    receipts: [...(project.receipts || []), receipt],
    updatedAt: new Date().toISOString()
  }
  
  updateProject(projectId, updated)
  return receipt
}

export function addValidationCheck(projectId: string, check: ValidationCheck): ValidationCheck | null {
  const data = getStorage()
  const checks = data.validationChecks || []
  
  checks.push(check)
  
  saveStorage({ ...data, validationChecks: checks })
  
  return check
}

export function getValidationChecks(projectId: string): ValidationCheck[] {
  const data = getStorage()
  const checks = data.validationChecks || []
  return checks.filter(c => c.projectId === projectId)
}

export function getSettings(): AppSettings {
  if (!isBrowser) return DEFAULT_SETTINGS
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return JSON.parse(stored)
  } catch (error) {
    console.error('[v0] Settings read error:', error)
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isBrowser) return
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('[v0] Settings save error:', error)
  }
}

export function resetSeedData(): void {
  if (!isBrowser) return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
