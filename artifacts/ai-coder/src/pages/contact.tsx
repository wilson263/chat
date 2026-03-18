import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLayout, PageHero } from '@/components/page-layout';
import {
  ArrowLeft, Sparkles, Mail, CheckCircle2, MessageCircle, Instagram,
  Twitter, Send, Phone, Globe, Linkedin, ExternalLink, Clock,
} from 'lucide-react';

const WHATSAPP_NUMBER = '8639922432';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

const CONTACT_CHANNELS = [
  {
    id: 'email',
    label: 'Email',
    value: 'support@zorvix.ai',
    description: 'Best for detailed questions & support',
    icon: Mail,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    href: 'mailto:support@zorvix.ai',
    badge: 'Recommended',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    active: true,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: '+91 86399 22432',
    description: 'Quick replies during business hours',
    icon: Phone,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    href: WHATSAPP_LINK,
    badge: 'Fast',
    badgeColor: 'bg-green-500/20 text-green-300',
    active: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: '@zorvixai',
    description: 'Follow us for updates & behind-the-scenes',
    icon: Instagram,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    href: 'https://instagram.com/zorvixai',
    badge: 'Coming Soon',
    badgeColor: 'bg-pink-500/20 text-pink-300',
    active: false,
    comingSoon: true,
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    value: '@zorvixai',
    description: 'Latest news, features & announcements',
    icon: Twitter,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    href: 'https://twitter.com/zorvixai',
    badge: 'News',
    badgeColor: 'bg-sky-500/20 text-sky-300',
    active: true,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    value: '@zorvixai',
    description: 'Join our community channel',
    icon: Send,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    href: 'https://t.me/zorvixai',
    badge: 'Coming Soon',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    active: false,
    comingSoon: true,
  },
  {
    id: 'discord',
    label: 'Discord',
    value: 'zorvixai',
    description: 'Chat with the community & team',
    icon: MessageCircle,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    href: 'https://discord.gg/zorvixai',
    badge: 'Chat',
    badgeColor: 'bg-indigo-500/20 text-indigo-300',
    active: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'ZorvixAI',
    description: 'Professional updates & company news',
    icon: Linkedin,
    color: 'text-blue-500',
    bg: 'bg-blue-600/10',
    border: 'border-blue-600/20',
    href: 'https://linkedin.com/company/zorvixai',
    badge: 'Professional',
    badgeColor: 'bg-blue-600/20 text-blue-300',
    active: true,
  },
  {
    id: 'website',
    label: 'Website',
    value: 'zorvix.ai',
    description: 'Explore all products & documentation',
    icon: Globe,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    href: 'https://zorvix.ai',
    badge: 'Docs',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    active: true,
  },
];

export default function ContactPage() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const categories = ['All', 'Support', 'Social', 'Community'];
  const categoryMap: Record<string, string[]> = {
    Support: ['email', 'whatsapp'],
    Social: ['instagram', 'twitter', 'linkedin'],
    Community: ['telegram', 'discord'],
  };
  const filtered = activeFilter === 'All'
    ? CONTACT_CHANNELS
    : CONTACT_CHANNELS.filter(c => categoryMap[activeFilter]?.includes(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@zorvix.ai?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.open(mailtoLink, '_blank');
    setSubmitted(true);
  };

  const handleChannelClick = (channel: typeof CONTACT_CHANNELS[0], e: React.MouseEvent) => {
    if (channel.comingSoon) {
      e.preventDefault();
      return;
    }
  };

  return (
    <PageLayout crumbs={[{ label: 'Contact' }]} backHref="/" withMeshBg>
      <div>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Have a question, feedback, or want to partner with us? Reach us on any channel you prefer.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                activeFilter === cat
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-14">
          {filtered.map(channel => {
            const Icon = channel.icon;
            return channel.comingSoon ? (
              <div
                key={channel.id}
                className={`relative group flex items-start gap-4 p-5 rounded-2xl border ${channel.border} ${channel.bg} opacity-60 cursor-not-allowed`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${channel.bg} border ${channel.border}`}>
                  <Icon className={`w-5 h-5 ${channel.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-foreground">{channel.label}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${channel.badgeColor}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {channel.badge}
                    </span>
                  </div>
                  <p className={`text-sm font-mono font-medium ${channel.color} truncate`}>{channel.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{channel.description}</p>
                </div>
              </div>
            ) : (
              <a
                key={channel.id}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleChannelClick(channel, e)}
                className={`group flex items-start gap-4 p-5 rounded-2xl border ${channel.border} ${channel.bg} hover:scale-[1.02] transition-all duration-200 hover:shadow-lg cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${channel.bg} border ${channel.border}`}>
                  <Icon className={`w-5 h-5 ${channel.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-foreground">{channel.label}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${channel.badgeColor}`}>
                      {channel.badge}
                    </span>
                  </div>
                  <p className={`text-sm font-mono font-medium ${channel.color} truncate`}>{channel.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{channel.description}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-1 transition-colors" />
              </a>
            );
          })}
        </div>

        <div className="mb-10 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300/80">
            <span className="font-semibold text-amber-300">Instagram & Telegram coming soon.</span>{' '}
            These community channels are being set up. In the meantime, reach us via WhatsApp or Email — we reply within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Send us a message</h2>
            <p className="text-muted-foreground text-sm mb-6">Fill in the form and we'll open your email client to send it directly.</p>

            {submitted ? (
              <div className="bg-card border border-border/50 rounded-2xl p-10 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Message sent!</h3>
                <p className="text-muted-foreground text-sm mb-6">Thanks for reaching out. We'll get back to you shortly.</p>
                <Button onClick={() => setSubmitted(false)} variant="outline" className="border-border/50">Send another</Button>
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl p-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Name</Label>
                      <Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-background/50 border-border/60 h-11" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Email</Label>
                      <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-background/50 border-border/60 h-11" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Subject</Label>
                    <Input placeholder="What's this about?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="bg-background/50 border-border/60 h-11" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Message</Label>
                    <textarea
                      placeholder="Tell us more..."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/50 transition-colors h-36"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-primary shadow-lg shadow-primary/20 text-base font-medium">
                    Send message
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground text-center mb-3">Or reach us directly</p>
                  <div className="flex gap-2">
                    <a
                      href={WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                    >
                      <Phone className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href="mailto:support@zorvix.ai"
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">FAQs</h2>
            {[
              { q: 'How do I reset my password?', a: 'Go to Settings → Account and click "Change Password". You can also use the forgot password link on the login page.' },
              { q: 'Can I use the API for free?', a: 'Yes! The Gemini-powered chat is free. For GPT-4o you need to add your own OpenAI API key in Settings.' },
              { q: 'How do I report a bug?', a: 'Open a GitHub issue or send us an email at support@zorvix.ai with steps to reproduce. We usually fix critical bugs within 48 hours.' },
              { q: 'Is there a mobile app?', a: 'A mobile-optimised web version is available. Native apps are on our roadmap — follow our socials for updates.' },
              { q: 'Do you offer a business plan?', a: 'Yes, reach out via WhatsApp (+91 86399 22432) or email with your use case and team size and we will send you a custom quote.' },
              { q: 'Where is Instagram / Telegram?', a: 'Our Instagram and Telegram community channels are coming very soon! Meanwhile, reach us on WhatsApp or Email.' },
            ].map((item, i) => (
              <details key={i} className="bg-card border border-border/50 rounded-xl px-5 py-4 group cursor-pointer">
                <summary className="text-sm font-medium text-foreground list-none flex items-center justify-between select-none">
                  {item.q}
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform ml-3 shrink-0">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
