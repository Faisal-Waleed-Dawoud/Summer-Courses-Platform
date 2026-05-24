import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"
import { getUserFromSessionId } from "./cookies"
import { redirect } from "next/navigation"
import { getUserById } from "./db/users"
import { UserSession } from "./types"


type FullUser = Exclude<
  Awaited<ReturnType<typeof getUserById>>,
  undefined | null
>

type User = Exclude<
  Awaited<ReturnType<typeof getUserFromSessionId>>,
  undefined | null
>


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentUser(options: {
  fullUser: true
  redirectIfNotFound: true
}) : Promise<FullUser>
export function getCurrentUser(options: {
  fullUser: true
  redirectIfNotFound?: false
}) : Promise<FullUser | null>
export function getCurrentUser(options: {
  fullUser?: false
  redirectIfNotFound: true
}) : Promise<User>
export function getCurrentUser(options: {
  fullUser?: false
  redirectIfNotFound?: false
}) : Promise<User | null>
export async function getCurrentUser({
  fullUser = false,
  redirectIfNotFound = false
} = {}) {
  const user = await getUserFromSessionId() as UserSession
  

  if (!user) {
    if (redirectIfNotFound) {
      redirect("/register")
    }
    return null
  }

  if (fullUser) {
    
    const fulluser = await getUserById(user.userId)
    
    if (fulluser == null) {
      throw new Error("User Does Not Exist")
    }
    return fulluser
  }

  return user
}

export function generateSalt() {
    return crypto.randomBytes(16).toString("hex").normalize()
}

export const hash = async (input: string, salt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(input.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error)

        resolve(hash.toString("hex").normalize())
    })
  })
}

export const compareHashes = async (input: string, hashed: string, salt: string ) => {
  const hashedInput = await hash(input, salt)

  return crypto.timingSafeEqual(
    Buffer.from(hashedInput, "hex"),
    Buffer.from(hashed, "hex")
  )
} 

export const formatDate = (time: number) => {
    const date = new Date(time)
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const hour = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()
    return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`
}