import prisma from '../prisma/client'

const DEFAULT_KEYS = ['meta_pixel_id', 'meta_access_token', 'meta_test_event_code'] as const

export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await prisma.appSetting.findUnique({ where: { key } })
  return setting?.value ?? null
}

export const getSettings = async (): Promise<Record<string, string>> => {
  const settings = await prisma.appSetting.findMany()
  const result: Record<string, string> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }
  return result
}

export const upsertSetting = async (key: string, value: string): Promise<void> => {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

export const upsertSettings = async (settings: Record<string, string>): Promise<void> => {
  for (const [key, value] of Object.entries(settings)) {
    if (DEFAULT_KEYS.includes(key as any)) {
      await upsertSetting(key, value)
    }
  }
}

export const seedDefaultSettings = async (): Promise<void> => {
  const envMap: Record<string, string | undefined> = {
    meta_pixel_id: process.env.META_PIXEL_ID,
    meta_access_token: process.env.META_ACCESS_TOKEN,
    meta_test_event_code: process.env.META_TEST_EVENT_CODE
  }
  for (const [key, envValue] of Object.entries(envMap)) {
    if (envValue && !envValue.includes('YOUR_')) {
      const existing = await getSetting(key)
      if (!existing) {
        await upsertSetting(key, envValue)
      }
    }
  }
}
