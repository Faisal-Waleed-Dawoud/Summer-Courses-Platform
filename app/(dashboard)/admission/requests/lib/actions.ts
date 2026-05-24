'use server'
import { authorize } from "@/lib/db/users"
import { getCurrentUser } from "@/lib/utils"
import { acceptCourse, rejectCourse, stopProvideCourse } from "./db"
import { revalidatePath } from "next/cache"
import { DatabaseError } from 'pg'
import { ValidationError } from "next/dist/compiled/amphtml-validator"
import Error from "next/error"

export async function courseAccept(courseId: string) {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "course:approve")
    if (isAuthorized === undefined) {
        return { status: 401, error: 'Unauthorized' }
    }

    try {
        await acceptCourse(currentUser.userId, courseId)
        revalidatePath("/admission/requests")
        return { status: 200 }
    } catch(error: DatabaseError | Error | ValidationError) {
        return { status: 500}
    }
}

export async function courseReject(courseId: string) {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "course:reject")
    if (isAuthorized === undefined) {
        return { status: 401, error: 'Unauthorized' }
    }

    try {
        await rejectCourse(currentUser.userId, courseId)
        revalidatePath("/admission/requests")
        return { status: 200 }
    } catch(error : DatabaseError | Error | ValidationError) {
        return { status: 500}
    }
}

export async function courseStopProvide(courseId: string) {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "course:reject")
    if (isAuthorized === undefined) {
        return { status: 401, error: 'Unauthorized' }
    }

    try {
        await stopProvideCourse(currentUser.userId, courseId)
        revalidatePath("/admission/requests")
        return { status: 200 }
    } catch(error : DatabaseError | Error | ValidationError) {
        return { status: 500}
    }
}
