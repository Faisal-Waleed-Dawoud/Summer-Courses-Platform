'use server'

import { authorize } from "@/lib/db/users"
import { getCurrentUser } from "@/lib/utils"
import { enrollmentApprove, enrollmentReject } from "./db"
import { revalidatePath } from "next/cache"
import Error from "next/error"
import { DatabaseError } from 'pg'
import { ValidationError } from "next/dist/compiled/amphtml-validator"

export const approveEnrollment = async (courseId: string, studentId: number) => {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "enrollment:approve")
    if (isAuthorized === undefined) {
        return { status: 401, error: 'Unauthorized' }
    }

    try {
        await enrollmentApprove(courseId, +studentId, currentUser.userId)
        revalidatePath("/admission/enrollments")
        return { status: 200 }
    } catch(error: Error | DatabaseError | ValidationError) {
        return { status: 500}
    }
}

export const rejectEnrollment = async(courseId: string, studentId: number) => {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "enrollment:reject")
    if (isAuthorized === undefined) {
        return { status: 401, error: 'Unauthorized' }
    }
    
    try {
        await enrollmentReject(courseId, +studentId, currentUser.userId)
        revalidatePath("/admission/enrollments")
        return { status: 200 }
    } catch(error: Error | DatabaseError | ValidationError) {
        return { status: 500}
    }
}