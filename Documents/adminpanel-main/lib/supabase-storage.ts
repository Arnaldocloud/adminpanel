import { supabase } from "./supabase"

export interface CardImage {
  cardNumber: number
  imageUrl: string
  filename: string
  numbers: number[]
  isAvailable: boolean
  reservedBy?: string
  reservedUntil?: string
}

// Función para subir imágenes de cartones al storage
export async function uploadCardImage(file: File, cardNumber: number): Promise<string> {
  const filename = `carton-${cardNumber.toString().padStart(4, "0")}.jpg`

  const { data, error } = await supabase.storage.from("bingo-cards").upload(filename, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (error) {
    throw new Error(`Error uploading image: ${error.message}`)
  }

  // Obtener URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("bingo-cards").getPublicUrl(filename)

  return publicUrl
}

// Función para obtener URL pública de una imagen
export function getCardImageUrl(filename: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from("bingo-cards").getPublicUrl(filename)

  return publicUrl
}

// Función para subir múltiples imágenes (para admin)
export async function uploadMultipleCardImages(files: FileList): Promise<{
  success: number
  errors: Array<{ cardNumber: number; error: string }>
}> {
  const results = {
    success: 0,
    errors: [] as Array<{ cardNumber: number; error: string }>,
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const cardNumber = i + 1 // Asumiendo que están en orden

    try {
      await uploadCardImage(file, cardNumber)
      results.success++
    } catch (error) {
      results.errors.push({
        cardNumber,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

// Función para eliminar imagen
export async function deleteCardImage(filename: string): Promise<void> {
  const { error } = await supabase.storage.from("bingo-cards").remove([filename])

  if (error) {
    throw new Error(`Error deleting image: ${error.message}`)
  }
}
