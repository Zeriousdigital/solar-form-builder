import crypto from 'crypto'

export const sha256Hash = (data: string): string => {
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex')
}

export const hashEmail = (email: string): string => {
  return sha256Hash(email)
}

export const hashPhone = (phone: string): string => {
  return sha256Hash(phone.replace(/[^0-9]/g, ''))
}
