import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save, ArrowLeft, Upload, X, ImagePlus, AlertCircle, CheckCircle2, Package, Trash2,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'
import { useAdminLog } from '@/lib/useAdminLog'
import { cn } from '@/lib/utils'

const CATEGORIES = ['phones', 'laptops', 'audio', 'tvs', 'monitors', 'cameras', 'appliances']
const BADGES = ['', 'Best Seller', 'New', 'Top Rated', 'Deal']

interface ProductForm {
  name: string
  description: string
  price: string
  category: string
  stock: string
  badge: string
  rating: string
  review_count: string
  images: string[]
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', price: '', category: 'phones',
  stock: '', badge: '', rating: '4.5', review_count: '0', images: [],
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { logAction } = useAdminLog()

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing product for edit
  useEffect(() => {
    if (!isEdit) return
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Product not found'); return }
        setForm({
          name: data.name || '',
          description: data.description || '',
          price: String(data.price || ''),
          category: data.category || 'phones',
          stock: String(data.stock || ''),
          badge: data.badge || '',
          rating: String(data.rating || '4.5'),
          review_count: String(data.review_count || '0'),
          images: data.images || [],
        })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const update = (field: keyof ProductForm, value: string | string[]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const uploadedUrls: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed.')
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be under 5MB.')
          continue
        }

        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { contentType: file.type })

        if (uploadErr) {
          // Storage not configured — fall back to object URL for demo
          const tempUrl = URL.createObjectURL(file)
          uploadedUrls.push(tempUrl)
          setError('Storage not configured — image preview only (not saved to cloud).')
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName)
          uploadedUrls.push(publicUrl)
        }
      }
      update('images', [...form.images, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) =>
    update('images', form.images.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim()) return setError('Product name is required.')
    if (!form.price || isNaN(Number(form.price))) return setError('Enter a valid price.')
    if (!form.stock || isNaN(Number(form.stock))) return setError('Enter a valid stock quantity.')

    setSaving(true)
    try {
      const adminRaw = localStorage.getItem('ew_admin_session')
      const adminId: string | null = adminRaw ? JSON.parse(adminRaw)?.id ?? null : null

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        category: form.category,
        stock: parseInt(form.stock),
        badge: form.badge || null,
        rating: parseFloat(form.rating) || 4.5,
        review_count: parseInt(form.review_count) || 0,
        images: form.images,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      }

      if (isEdit) {
        const { error: err } = await supabase.from('products').update(payload).eq('id', id)
        if (err) throw err
        setSuccess('Product updated successfully!')
        logAction({ action: 'update_product', targetId: id, targetName: form.name.trim(), details: { category: form.category, price: parseFloat(form.price) } })
      } else {
        const { data: newProd, error: err } = await supabase.from('products').insert({ ...payload, created_by: adminId }).select('id').single()
        if (err) throw err
        setSuccess('Product created successfully!')
        logAction({ action: 'create_product', targetId: newProd?.id, targetName: form.name.trim(), details: { category: form.category, price: parseFloat(form.price) } })
        setTimeout(() => navigate('/admin/products'), 1200)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed. Check your admin permissions.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    setError('')
    try {
      // Clean up references — ignore errors silently
      await supabase.from('order_items').update({ product_id: null }).eq('product_id', id).then(() => {})
      await supabase.from('cart_items').delete().eq('product_id', id).then(() => {})
      await supabase.from('wishlists').delete().eq('product_id', id).then(() => {})

      const { error: err } = await supabase.from('products').delete().eq('id', id)
      if (err) throw err
      logAction({ action: 'delete_product', targetId: id, targetName: form.name.trim() })
      navigate('/admin/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const inputClass = 'input-dark text-sm'
  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1.5'

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E31A2D', borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary transition-all"
            style={{ border: '1px solid #D9E1EB', background: '#fff' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-heading font-bold text-2xl text-text-primary">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-text-muted text-sm">
              {isEdit ? 'Update product details below' : 'Fill in the details to add a product to the store'}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-brand-red/20 text-brand-red text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Product Images */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
          <h2 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-brand-red" />
            Product Images
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden" style={{ border: '1px solid #D9E1EB' }}>
                <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-brand-red text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded" style={{ background: '#E31A2D' }}>
                    Main
                  </span>
                )}
              </div>
            ))}

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1.5 text-text-muted hover:text-brand-red hover:border-brand-red/40 transition-all"
              style={{ border: '2px dashed #D9E1EB' }}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Upload</span>
                </>
              )}
            </button>
          </div>

          {form.images.length === 0 && (
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-brand-red/40 transition-all"
              style={{ borderColor: '#D9E1EB' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Package className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-text-secondary">Click to upload product images</p>
              <p className="text-xs text-text-muted mt-1">PNG, JPG, WebP up to 5MB each</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleImageUpload(e.target.files)}
          />

          {/* Manual URL input */}
          <div className="mt-3">
            <label className={labelClass}>Or paste an image URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                className={cn(inputClass, 'flex-1')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) { update('images', [...form.images, val]); (e.target as HTMLInputElement).value = '' }
                  }
                }}
              />
              <button
                type="button"
                className="px-3 py-2 rounded-xl text-sm font-medium text-white transition-all"
                style={{ background: '#102E5A' }}
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="https://example"]') as HTMLInputElement
                  if (input?.value.trim()) { update('images', [...form.images, input.value.trim()]); input.value = '' }
                }}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">Press Enter or click Add to insert URL</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #D9E1EB', boxShadow: '0 2px 12px rgba(0,28,63,0.06)' }}>
          <h2 className="font-heading font-semibold text-text-primary mb-4">Product Information</h2>
          <div className="space-y-4">

            <div>
              <label className={labelClass}>Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g. Sony WH-1000XM5"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe the product features, specs, and highlights..."
                rows={3}
                className={cn(inputClass, 'resize-none')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Price (USD) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="299.99"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Stock Quantity *</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => update('stock', e.target.value)}
                  placeholder="50"
                  min="0"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Badge</label>
                <select value={form.badge} onChange={e => update('badge', e.target.value)} className={inputClass}>
                  {BADGES.map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Rating (0–5)</label>
                <input
                  type="number"
                  value={form.rating}
                  onChange={e => update('rating', e.target.value)}
                  placeholder="4.5"
                  min="0"
                  max="5"
                  step="0.1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Review Count</label>
                <input
                  type="number"
                  value={form.review_count}
                  onChange={e => update('review_count', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-xl text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: '#E31A2D', boxShadow: '0 4px 14px rgba(227,26,45,0.3)' }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? 'Save Changes' : 'Create Product'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="font-medium text-sm px-6 py-3 rounded-xl transition-all text-text-secondary hover:text-text-primary"
            style={{ border: '1px solid #D9E1EB', background: '#fff' }}
          >
            Cancel
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="ml-auto flex items-center gap-2 font-medium text-sm px-5 py-3 rounded-xl transition-all text-brand-red hover:bg-red-50 active:scale-95"
              style={{ border: '1px solid rgba(227,26,45,0.25)' }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Product
            </button>
          )}
        </div>
      </form>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,28,63,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ border: '1px solid #D9E1EB', boxShadow: '0 16px 48px rgba(0,28,63,0.15)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEE2E2' }}>
              <Trash2 className="w-6 h-6 text-brand-red" />
            </div>
            <h3 className="font-heading font-bold text-text-primary text-center mb-1">Delete this product?</h3>
            <p className="text-text-muted text-sm text-center mb-5">This cannot be undone. The product will be removed from the store.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border text-text-secondary hover:bg-dark-muted transition-all"
                style={{ borderColor: '#D9E1EB' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: '#E31A2D' }}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
