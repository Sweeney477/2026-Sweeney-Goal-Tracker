'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Upload, HelpCircle, LayoutGrid, List as ListIcon, Camera } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { Photo } from '@/lib/types'
import { cn } from '@/lib/utils'

type PhotoWithUrl = Photo & { signedUrl?: string | null }

export default function PhotosPage() {
  const supabase = createClient()
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formKind, setFormKind] = useState<'front' | 'side' | 'back'>('front')
  const [formNotes, setFormNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const PHOTOS_PER_PAGE = 12
  const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPhotos(1, false)
  }, [])

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    // Check cache first
    const cached = signedUrlCache.get(storagePath)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url
    }

    // Generate new signed URL
    const { data: urlData } = await supabase.storage
      .from('progress-photos')
      .createSignedUrl(storagePath, 3600)

    if (urlData?.signedUrl) {
      // Cache for 50 minutes (slightly less than 1 hour expiry)
      signedUrlCache.set(storagePath, {
        url: urlData.signedUrl,
        expiresAt: Date.now() + 50 * 60 * 1000,
      })
      return urlData.signedUrl
    }

    return null
  }

  const loadPhotos = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setPhotos([])
        setAllPhotos([])
        setHasMore(false)
        return
      }

      const from = (pageNum - 1) * PHOTOS_PER_PAGE
      const to = from + PHOTOS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(from, to)

      if (error) throw error

      const newPhotos = (data || []) as Photo[]
      setHasMore(newPhotos.length === PHOTOS_PER_PAGE)

      if (append) {
        setAllPhotos((prev) => [...prev, ...newPhotos])
      } else {
        setAllPhotos(newPhotos)
      }

      // Only generate signed URLs for the photos we're displaying
      const photosToLoad = append ? newPhotos : newPhotos
      const photosWithUrls = await Promise.all(
        photosToLoad.map(async (photo) => {
          const signedUrl = await getSignedUrl(photo.storage_path)
          return { ...photo, signedUrl }
        })
      )

      if (append) {
        setPhotos((prev) => [...prev, ...photosWithUrls])
      } else {
        setPhotos(photosWithUrls)
      }
    } catch (error) {
      console.error('Error loading photos:', error)
      if (!append) {
        setPhotos([])
        setAllPhotos([])
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    await loadPhotos(nextPage, true)
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
      setPage(1)
      await loadPhotos(1, false)
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      toast(error.message || 'Failed to upload photo. Please try again.', 'error')
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

  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a))
  const latestDate = sortedDates[0]
  const latestPhotos = latestDate ? photosByDate[latestDate] : []
  const latestPhoto = latestPhotos?.[0] || null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Progress Photos</h1>
          <p className="text-sm text-muted-foreground">Keep track of your transformation</p>
        </div>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"
          onClick={() => toast('Tip: Try to shoot with consistent lighting + pose.', 'info')}
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Capture card */}
      <div className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white">
            <Camera className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Capture Progress</div>
            <div className="text-xs text-muted-foreground">Keep track of your transformation</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label
            htmlFor="file"
            className={cn(
              'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-4 text-center',
              file ? 'border-blue-600/40 bg-blue-50/30' : 'border-blue-600/30'
            )}
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-background shadow-sm">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-sm font-semibold">Tap to upload photo</div>
            <div className="text-xs text-muted-foreground">or drag and drop here</div>
            {file && (
              <div className="mt-2 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                {file.name}
              </div>
            )}
          </label>
          <Input
            id="file"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground">
                DATE
              </Label>
              <Input
                id="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kind" className="text-xs font-semibold text-muted-foreground">
                POSE
              </Label>
              <select
                id="kind"
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as 'front' | 'side' | 'back')}
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="front">Front</option>
                <option value="side">Side</option>
                <option value="back">Back</option>
              </select>
            </div>
          </div>

          {/* Notes kept, but subtle */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground">
              NOTES (OPTIONAL)
            </Label>
            <Input
              id="notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Lighting, weight, etc."
              className="h-12 rounded-2xl"
            />
          </div>

          <Button
            type="submit"
            disabled={uploading || !file}
            className="h-12 w-full rounded-2xl bg-blue-600 text-white hover:bg-blue-600/90"
          >
            {uploading ? 'Uploading…' : 'Save Entry'}
          </Button>
        </form>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="text-xl font-semibold">Photo Timeline</div>
          <div className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {photos.length}
          </div>
        </div>

        <div className="flex overflow-hidden rounded-2xl border bg-background">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'grid h-11 w-11 place-items-center',
              viewMode === 'grid' ? 'bg-muted/40 text-foreground' : 'text-muted-foreground'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'grid h-11 w-11 place-items-center border-l',
              viewMode === 'list' ? 'bg-muted/40 text-foreground' : 'text-muted-foreground'
            )}
            aria-label="List view"
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : sortedDates.length === 0 ? (
        <div className="rounded-3xl border bg-background p-6 text-center text-sm text-muted-foreground">
          No photos yet. Add your first entry above.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Featured latest */}
          {latestPhoto && (
            <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
              <div className="relative">
                {latestPhoto.signedUrl ? (
                  <img
                    src={latestPhoto.signedUrl}
                    alt="Latest progress"
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="h-56 w-full bg-muted" />
                )}
                <div className="absolute left-4 top-4 rounded-full bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white">
                  NEWEST
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                  <div className="text-xs opacity-90">{format(new Date(latestPhoto.date), 'MMM d, yyyy')}</div>
                  <div className="text-lg font-semibold capitalize">{latestPhoto.kind} View</div>
                  {latestPhoto.notes && <div className="text-xs opacity-90">{latestPhoto.notes}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Older */}
          <div className="space-y-6">
            {(Object.entries(photosByDate) as [string, PhotoWithUrl[]][])
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, showAll ? undefined : 3)
              .map(([date, datePhotos]) => (
                <div key={date}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{format(new Date(date), 'MMMM d, yyyy')}</h3>
                    <div className="text-xs text-muted-foreground">{datePhotos.length} photo(s)</div>
                  </div>

                  {viewMode === 'list' ? (
                    <div className="grid gap-3">
                      {datePhotos.map((photo) => (
                        <div key={photo.id} className="flex gap-3 rounded-2xl border bg-background p-3">
                          <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
                            {photo.signedUrl ? (
                              <img
                                src={photo.signedUrl}
                                alt={`${photo.kind} view`}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold capitalize">{photo.kind}</div>
                            {photo.notes && (
                              <div className="truncate text-xs text-muted-foreground">{photo.notes}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {datePhotos.map((photo) => (
                        <div key={photo.id} className="overflow-hidden rounded-2xl border bg-background">
                          {photo.signedUrl ? (
                            <img
                              src={photo.signedUrl}
                              alt={`${photo.kind} view`}
                              className="h-40 w-full object-cover"
                            />
                          ) : (
                            <div className="h-40 w-full bg-muted" />
                          )}
                          <div className="p-3">
                            <div className="text-xs font-semibold capitalize">{photo.kind}</div>
                            {photo.notes && <div className="mt-1 text-xs text-muted-foreground">{photo.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {sortedDates.length > 3 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed bg-background px-4 py-3 text-sm font-semibold text-muted-foreground"
            >
              View Older Photos ({sortedDates.length - 3})
            </button>
          )}

          {!loading && photos.length > 0 && hasMore ? (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
              className="w-full rounded-2xl"
            >
              {loadingMore ? 'Loading...' : 'Load More Photos'}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

