'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POSInterface } from '@/components/pos/pos-interface'
import { SalesHistory } from '@/components/sales/sales-history'
import { ReturnsExchanges } from '@/components/sales/returns-exchanges'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SalesPage() {
    const [showPOS, setShowPOS] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Sales</h1>
                    <p className="text-muted-foreground">
                        Process sales and manage transactions
                    </p>
                </div>
                <Button onClick={() => setShowPOS(true)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    New Sale
                </Button>
            </div>

            <Tabs defaultValue="pos" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pos">Point of Sale</TabsTrigger>
                    <TabsTrigger value="history">Sales History</TabsTrigger>
                    <TabsTrigger value="returns">Returns & Exchanges</TabsTrigger>
                </TabsList>

                <TabsContent value="pos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Point of Sale System</CardTitle>
                            <CardDescription>
                                Process customer transactions quickly and efficiently
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setShowPOS(true)} size="lg">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Start New Sale
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <SalesHistory />
                </TabsContent>

                <TabsContent value="returns" className="space-y-4">
                    <ReturnsExchanges />
                </TabsContent>
            </Tabs>

            <Dialog open={showPOS} onOpenChange={setShowPOS}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Point of Sale</DialogTitle>
                    </DialogHeader>
                    <POSInterface onClose={() => setShowPOS(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}