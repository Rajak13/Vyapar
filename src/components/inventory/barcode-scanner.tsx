'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Scan, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  trigger?: React.ReactNode
}

export function BarcodeScanner({ onBarcodeDetected, trigger }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scanHistory, setScanHistory] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup camera stream when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        
        // In a real implementation, you would integrate with a barcode scanning library
        // like QuaggaJS, ZXing, or use the Barcode Detection API
        simulateBarcodeDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Simulate barcode detection for demo purposes
  // In a real app, this would be replaced with actual barcode detection
  const simulateBarcodeDetection = () => {
    // This is just for demonstration
    setTimeout(() => {
      if (isScanning) {
        const mockBarcode = `${Date.now().toString().slice(-8)}`
        handleBarcodeDetected(mockBarcode)
      }
    }, 3000)
  }

  const handleBarcodeDetected = (barcode: string) => {
    setScanHistory(prev => [barcode, ...prev.slice(0, 4)]) // Keep last 5 scans
    onBarcodeDetected(barcode)
    toast.success(`Barcode detected: ${barcode}`)
    stopCamera()
  }

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) {
      toast.error('Please enter a barcode')
      return
    }
    
    handleBarcodeDetected(manualBarcode.trim())
    setManualBarcode('')
    setOpen(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // In a real implementation, you would process the image to extract barcode
    // For demo purposes, we'll simulate barcode extraction
    const reader = new FileReader()
    reader.onload = () => {
      // Simulate barcode extraction from image
      const mockBarcode = `IMG${Date.now().toString().slice(-6)}`
      handleBarcodeDetected(mockBarcode)
      toast.success('Barcode extracted from image')
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        stopCamera()
        setManualBarcode('')
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Scan className="h-4 w-4 mr-2" />
            Scan Barcode
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Scanner</DialogTitle>
          <DialogDescription>
            Scan a barcode using your camera or enter it manually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isScanning ? (
                <div className="text-center">
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Camera preview will appear here</p>
                    </div>
                  </div>
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 bg-black rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-32 border-2 border-red-500 border-dashed rounded-lg flex items-center justify-center">
                        <Scan className="h-8 w-8 text-red-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                    <Button 
                      onClick={() => handleBarcodeDetected(`DEMO${Date.now().toString().slice(-6)}`)}
                      className="flex-1"
                    >
                      Simulate Scan
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Position the barcode within the red frame
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode manually"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <label htmlFor="barcode-image" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Upload an image containing a barcode
                    </p>
                  </div>
                </label>
                <input
                  id="barcode-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Scans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scanHistory.map((barcode, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        onBarcodeDetected(barcode)
                        setOpen(false)
                      }}
                    >
                      <span className="font-mono text-sm">{barcode}</span>
                      <Badge variant="outline">
                        {index === 0 ? 'Latest' : `${index + 1}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Barcode Generator Component
export function BarcodeGenerator({ value }: { value: string }) {
  if (!value) return null

  return (
    <div className="text-center p-4 bg-white border rounded-lg">
      <div className="font-mono text-lg mb-2">{value}</div>
      {/* In a real implementation, you would use a barcode generation library */}
      <div className="flex justify-center">
        <div className="flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-12 ${
                Math.random() > 0.5 ? 'bg-black' : 'bg-white'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">Barcode representation</p>
    </div>
  )
}