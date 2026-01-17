// resources/js/Pages/Test.jsx
import React from 'react';
import SimpleLayout from '@/Layouts/SimpleLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import { Badge } from '@/Components/ui/Badge';

export default function Test() {
    return (
        <SimpleLayout
            pageTitle="UI Components Test"
            userRole="superadmin"
        >
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">shadcn/ui Components</h2>
                    <p className="text-sm text-gray-600">
                        Testing all UI components for STJ Tracker Admin
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Buttons</CardTitle>
                        <CardDescription>Different button variants and sizes</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button>Default</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                        <Button size="sm">Small</Button>
                        <Button size="lg">Large</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Badges</CardTitle>
                        <CardDescription>Status indicators for different states</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Form Elements</CardTitle>
                        <CardDescription>Input fields and labels for forms</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="Enter your email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" type="password" placeholder="Enter password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" type="text" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" placeholder="+62 812 3456 7890" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button className="flex-1">Submit Form</Button>
                            <Button variant="outline" className="flex-1">Cancel</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Total Components
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">12</div>
                            <p className="mt-1 text-xs text-gray-500">UI components ready</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Variants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">25+</div>
                            <p className="mt-1 text-xs text-gray-500">Different styles</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Badge variant="success">Ready</Badge>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">All components working</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>STJ Tracker Features</CardTitle>
                        <CardDescription>
                            Key features of the bus monitoring system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Real-time GPS Tracking</h4>
                                    <p className="text-sm text-gray-600">
                                        Monitor bus locations in real-time with Firebase integration
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Analytics Dashboard</h4>
                                    <p className="text-sm text-gray-600">
                                        Comprehensive reports and occupancy statistics
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">User Management</h4>
                                    <p className="text-sm text-gray-600">
                                        Role-based access control for admin and superadmin
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                                    <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Revenue Reports</h4>
                                    <p className="text-sm text-gray-600">
                                        Track income and trip history for all routes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </SimpleLayout>
    );
}