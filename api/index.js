require('dotenv').config()
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')
const axios = require('axios')

const app = express()
app.use(express.json())

const prisma = new PrismaClient()

const PIXEL_ID = process.env.META_PIXEL_ID || ''
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || ''

function hashSha256(data) {
  return crypto.createHash('sha256').update(String(data).trim().toLowerCase()).digest('hex')
}

async function sendToCAPI(eventName, userData, customData) {
  const payload = { em: [], ph: [] }
  if (userData.email) payload.em = [hashSha256(userData.email)]
  if (userData.phone) payload.ph = [hashSha256(userData.phone)]
  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: payload,
    custom_data: customData || {}
  }
  try {
    await axios.post(`https://graph.facebook.com/v20.0/${PIXEL_ID}/events`, {
      data: [event], access_token: ACCESS_TOKEN
    })
  } catch (e) {
    console.warn('CAPI error:', e.message)
  }
}

// Forms
app.get('/api/forms', async (_req, res) => {
  try {
    const forms = await prisma.form.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: forms })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.get('/api/forms/:id', async (req, res) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.id } })
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' })
    res.json({ success: true, data: form })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.post('/api/forms', async (req, res) => {
  try {
    const { name, description, fields, settings, isPublished } = req.body
    if (!name) return res.status(400).json({ success: false, error: 'Name required' })
    const form = await prisma.form.create({
      data: { name, description, schema: { fields: fields || [], settings: settings || {} }, isPublished: !!isPublished }
    })
    res.status(201).json({ success: true, data: form })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.put('/api/forms/:id', async (req, res) => {
  try {
    const { name, description, fields, settings, isPublished } = req.body
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, error: 'Form not found' })
    const es = existing.schema || { fields: [], settings: {} }
    const form = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        schema: { fields: fields !== undefined ? fields : (es.fields || []), settings: settings !== undefined ? settings : (es.settings || {}) },
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished
      }
    })
    res.json({ success: true, data: form })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.delete('/api/forms/:id', async (req, res) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, error: 'Form not found' })
    await prisma.form.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Deleted' })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.post('/api/forms/:id/publish', async (req, res) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, error: 'Form not found' })
    const form = await prisma.form.update({ where: { id: req.params.id }, data: { isPublished: true } })
    res.json({ success: true, data: form })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.post('/api/forms/:id/draft', async (req, res) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ success: false, error: 'Form not found' })
    const form = await prisma.form.update({ where: { id: req.params.id }, data: { isPublished: false } })
    res.json({ success: true, data: form })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

// Settings
app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await prisma.appSetting.findMany()
    const map = {}
    settings.forEach(s => { map[s.key] = s.value })
    res.json({ success: true, data: map })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.put('/api/settings', async (req, res) => {
  try {
    const entries = req.body
    for (const [key, value] of Object.entries(entries)) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    }
    res.json({ success: true })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

// Submissions
app.post('/api/submissions', async (req, res) => {
  try {
    const { formId, submissionData, isQualified, qualifyingScore, qualifyingTotal } = req.body
    if (!formId || !submissionData) return res.status(400).json({ success: false, error: 'formId and submissionData required' })
    const form = await prisma.form.findUnique({ where: { id: formId } })
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' })
    if (!form.isPublished) return res.status(400).json({ success: false, error: 'Form not published' })
    const submission = await prisma.formResponse.create({
      data: { formId, submissionData, isQualified: !!isQualified, qualifyingScore: qualifyingScore ?? 0, qualifyingTotal: qualifyingTotal ?? 0 }
    })
    const email = submissionData.email || submissionData.Email
    const phone = submissionData.phone || submissionData.Phone
    sendToCAPI('Lead', { email, phone }, { form_name: form.name, is_qualified: !!isQualified, form_id: formId })
    res.status(201).json({ success: true, data: submission })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.get('/api/submissions/:formId', async (req, res) => {
  try {
    const { formId } = req.params
    const form = await prisma.form.findUnique({ where: { id: formId } })
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' })
    const submissions = await prisma.formResponse.findMany({ where: { formId }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: submissions })
  } catch (e) { res.status(500).json({ success: false, error: e.message }) }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

module.exports = app
