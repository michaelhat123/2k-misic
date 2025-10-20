"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, Eye, Check, Archive, Trash2, RefreshCw, Filter } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Contact {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  createdAt: string
  emailSent: boolean
  ipAddress?: string
  userAgent?: string
}

interface Stats {
  total: number
  new: number
  read: number
  replied: number
  archived: number
  today: number
  thisWeek: number
}

export default function ContactDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/contact/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const url = new URL('http://localhost:3001/contact/dashboard')
      url.searchParams.append('page', page.toString())
      url.searchParams.append('limit', '20')
      if (statusFilter !== 'all') {
        url.searchParams.append('status', statusFilter)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setContacts(data.contacts)
        setTotalPages(data.pages)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:3001/contact/dashboard/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      if (data.success) {
        fetchContacts()
        fetchStats()
        if (selectedContact?.id === id) {
          setSelectedContact(data.contact)
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const deleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact submission?')) return

    try {
      await fetch(`http://localhost:3001/contact/dashboard/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      fetchContacts()
      fetchStats()
      if (selectedContact?.id === id) {
        setSelectedContact(null)
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchContacts()
  }, [page, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500'
      case 'read': return 'bg-yellow-500'
      case 'replied': return 'bg-green-500'
      case 'archived': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Contact Dashboard</h1>
          <p className="text-gray-300">Manage contact form submissions</p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
          >
            <StatCard label="Total" value={stats.total} color="purple" />
            <StatCard label="New" value={stats.new} color="blue" />
            <StatCard label="Read" value={stats.read} color="yellow" />
            <StatCard label="Replied" value={stats.replied} color="green" />
            <StatCard label="Archived" value={stats.archived} color="gray" />
            <StatCard label="Today" value={stats.today} color="pink" />
            <StatCard label="This Week" value={stats.thisWeek} color="indigo" />
          </motion.div>
        )}

        {/* Filter and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-6 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            onClick={() => { fetchContacts(); fetchStats(); }}
            className="px-4 py-2 bg-primary/20 border border-primary/50 rounded-lg text-primary hover:bg-primary/30 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Contacts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contacts List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Submissions</h2>
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No contacts found</div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedContact?.id === contact.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{contact.name}</h3>
                          <p className="text-sm text-gray-400">{contact.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </div>
                      <p className="text-white text-sm mb-2">{contact.subject}</p>
                      <p className="text-gray-400 text-xs">{formatDate(contact.createdAt)}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white/10 rounded text-white disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-white">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white/10 rounded text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>

          {/* Contact Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Details</h2>
            {selectedContact ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white font-semibold">{selectedContact.name}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white">{selectedContact.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Subject</label>
                    <p className="text-white">{selectedContact.subject}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Message</label>
                    <p className="text-white bg-white/5 p-4 rounded-lg whitespace-pre-wrap">
                      {selectedContact.message}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <p className="text-white">
                      <span className={`px-3 py-1 rounded text-sm ${getStatusColor(selectedContact.status)}`}>
                        {selectedContact.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Date</label>
                    <p className="text-white">{formatDate(selectedContact.createdAt)}</p>
                  </div>
                  {selectedContact.ipAddress && (
                    <div>
                      <label className="text-gray-400 text-sm">IP Address</label>
                      <p className="text-white">{selectedContact.ipAddress}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-400 text-sm">Email Sent</label>
                    <p className="text-white">{selectedContact.emailSent ? '✅ Yes' : '❌ No'}</p>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <h3 className="text-white font-semibold mb-2">Actions</h3>
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'read')}
                      className="w-full px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Mark as Read
                    </button>
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'replied')}
                      className="w-full px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Replied
                    </button>
                    <button
                      onClick={() => updateStatus(selectedContact.id, 'archived')}
                      className="w-full px-4 py-2 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <button
                      onClick={() => deleteContact(selectedContact.id)}
                      className="w-full px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a contact to view details</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-700',
    blue: 'from-blue-500 to-blue-700',
    yellow: 'from-yellow-500 to-yellow-700',
    green: 'from-green-500 to-green-700',
    gray: 'from-gray-500 to-gray-700',
    pink: 'from-pink-500 to-pink-700',
    indigo: 'from-indigo-500 to-indigo-700',
  }

  return (
    <div className={`glass rounded-xl p-4 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}/20`}>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
    </div>
  )
}
