'use client';

import { useState } from 'react';
import { HelpCircle, MessageCircle, Mail, Book, Users, Settings, CheckSquare, Bell, Search, ChevronDown, ChevronRight } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: "How do I create a new task?",
    answer: "Click the 'New Task' button on the Tasks page or Dashboard. Fill in the task details including title, description, priority, and due date. You can assign it to team members and set a priority level."
  },
  {
    question: "How do I assign tasks to team members?",
    answer: "When creating or editing a task, click on the assignee field and select a team member from the dropdown. You can also change assignees later by editing the task."
  },
  {
    question: "What are the different task statuses?",
    answer: "Tasks can have the following statuses: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED. You can change the status by clicking the status button on any task card."
  },
  {
    question: "How do I receive notifications?",
    answer: "Notifications appear in the bell icon in the header. You can configure your notification preferences in Settings to receive emails, push notifications, or both."
  },
  {
    question: "How do I change my password?",
    answer: "Go to Settings > Account and click 'Change Password'. You'll receive an email with instructions to reset your password securely."
  },
  {
    question: "Can I export my tasks?",
    answer: "Yes, you can export your tasks to CSV or PDF format from the Tasks page. Look for the export button in the filters section."
  },
  {
    question: "How do I invite new team members?",
    answer: "As an admin, go to Settings > Team Management to invite new members. They'll receive an email invitation to join your organization."
  },
  {
    question: "What are task priorities?",
    answer: "Tasks can be set to Low, Medium, High, or Urgent priority. This helps your team focus on the most important work first."
  }
];

const quickActions = [
  {
    icon: CheckSquare,
    title: "Create Task",
    description: "Add a new task to your workspace",
    action: "Go to Tasks → New Task"
  },
  {
    icon: Users,
    title: "Invite Team Members",
    description: "Add colleagues to your workspace",
    action: "Settings → Team Management"
  },
  {
    icon: Bell,
    title: "Configure Notifications",
    description: "Set up your notification preferences",
    action: "Settings → Notifications"
  },
  {
    icon: Settings,
    title: "Customize Settings",
    description: "Personalize your TaskFlow experience",
    action: "Settings → Preferences"
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg shadow-purple-500/50">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
              Help & Support
            </h1>
            <p className="text-white/70 text-lg">
              Find answers to common questions and get help with TaskFlow
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="faqs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="contact">Contact Support</TabsTrigger>
            </TabsList>

            <TabsContent value="faqs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Quick answers to common questions about TaskFlow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No results found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="getting-started" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Book className="mr-2 h-5 w-5 text-blue-600" />
                      Quick Start Guide
                    </CardTitle>
                    <CardDescription>
                      Get up and running with TaskFlow in minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Sign up for an account</h4>
                          <p className="text-sm text-gray-600">Create your TaskFlow account and verify your email</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Create your first task</h4>
                          <p className="text-sm text-gray-600">Click "New Task" and fill in the details</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Invite your team</h4>
                          <p className="text-sm text-gray-600">Add team members to start collaborating</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium">Configure notifications</h4>
                          <p className="text-sm text-gray-600">Set up how you want to be notified</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks you can do right away
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {quickActions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0">
                            <action.icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{action.title}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                            <p className="text-xs text-blue-600 mt-1">{action.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckSquare className="mr-2 h-5 w-5 text-green-600" />
                      Task Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Create and edit tasks</li>
                      <li>• Assign to team members</li>
                      <li>• Set priorities and due dates</li>
                      <li>• Track progress with statuses</li>
                      <li>• Add detailed descriptions</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="mr-2 h-5 w-5 text-orange-600" />
                      Real-time Collaboration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Live task updates</li>
                      <li>• Instant notifications</li>
                      <li>• Team activity feed</li>
                      <li>• Real-time status changes</li>
                      <li>• Collaborative editing</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5 text-purple-600" />
                      Customization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Personal preferences</li>
                      <li>• Notification settings</li>
                      <li>• Theme customization</li>
                      <li>• Dashboard widgets</li>
                      <li>• Keyboard shortcuts</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                      Live Chat Support
                    </CardTitle>
                    <CardDescription>
                      Get instant help from our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Our support team is available Monday through Friday, 9 AM - 6 PM EST.
                    </p>
                    <Button className="w-full">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="mr-2 h-5 w-5 text-green-600" />
                      Email Support
                    </CardTitle>
                    <CardDescription>
                      Send us a detailed message about your issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      We'll respond within 24 hours. Please include screenshots if applicable.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>General Support:</strong><br />
                        support@taskflow.com
                      </p>
                      <p className="text-sm">
                        <strong>Billing:</strong><br />
                        billing@taskflow.com
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Community Resources</CardTitle>
                  <CardDescription>
                    Learn from other TaskFlow users and experts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Book className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                      <h4 className="font-medium">Documentation</h4>
                      <p className="text-sm text-gray-600">Comprehensive guides and tutorials</p>
                      <Button variant="link" className="mt-2 p-0">View Docs</Button>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <Users className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <h4 className="font-medium">Community Forum</h4>
                      <p className="text-sm text-gray-600">Ask questions and share knowledge</p>
                      <Button variant="link" className="mt-2 p-0">Join Forum</Button>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <HelpCircle className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                      <h4 className="font-medium">Video Tutorials</h4>
                      <p className="text-sm text-gray-600">Step-by-step video guides</p>
                      <Button variant="link" className="mt-2 p-0">Watch Videos</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}


