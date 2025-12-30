'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Upload } from 'lucide-react'
import { Photo } from '@/lib/types'

type PhotoWithUrl = Photo & { signedUrl?: string | null }

export default function PhotosPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formKind, setFormKind] = useState<'front' | 'side' | 'back'>('front')
  const [formNotes, setFormNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [])

  const loadPhotos = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error

      // Get signed URLs for each photo
      const photosWithUrls = await Promise.all(
        ((data || []) as Photo[]).map(async (photo) => {
          const { data: urlData } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(photo.storage_path, 3600)

          return { ...photo, signedUrl: urlData?.signedUrl || null }
        })
      )

      setPhotos(photosWithUrls)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = fileName

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save photo record
      const { error: dbError } = await supabase.from('photos').insert({
        user_id: user.id,
        date: formDate,
        kind: formKind,
        storage_path: filePath,
        notes: formNotes || null,
      })

      if (dbError) throw dbError

      setFile(null)
      setFormNotes('')
      setFormDate(format(new Date(), 'yyyy-MM-dd'))
      loadPhotos()
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Group photos by date
  const photosByDate = photos.reduce<Record<string, PhotoWithUrl[]>>((acc, photo) => {
    const dateKey = photo.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(photo)
    return acc
  }, {})

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Progress Photos</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress with photos over time
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
            <CardDescription>Add a progress photo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kind">Photo Type</Label>
                <select
                  id="kind"
                  value={formKind}
                  onChange={(e) => setFormKind(e.target.value as 'front' | 'side' | 'back')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Photo</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
              <Button type="submit" disabled={uploading || !file}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photo Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : Object.keys(photosByDate).length === 0 ? (
              <div className="text-muted-foreground">No photos yet</div>
            ) : (
              <div className="space-y-6">
                {(Object.entries(photosByDate) as [string, PhotoWithUrl[]][])
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([date, datePhotos]) => (
                    <div key={date}>
                      <h3 className="font-semibold mb-3">
                        {format(new Date(date), 'MMMM d, yyyy')}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {datePhotos.map((photo) => (
                          <div key={photo.id} className="space-y-2">
                            {photo.signedUrl ? (
                              <img
                                src={photo.signedUrl}
                                alt={`${photo.kind} view`}
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                                <span className="text-muted-foreground">Loading...</span>
                              </div>
                            )}
                            <div className="text-sm">
                              <div className="font-medium capitalize">{photo.kind}</div>
                              {photo.notes && (
                                <div className="text-muted-foreground">{photo.notes}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

