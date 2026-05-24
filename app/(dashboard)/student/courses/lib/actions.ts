'use server'

import { authorize } from "@/lib/db/users"
import { getCurrentUser } from "@/lib/utils"
import { insertEnrollment } from "./db"
import { revalidatePath } from "next/cache"
import { getStudentById } from "@/lib/db/student"
import { Student } from "@/lib/types"
import { EnrollmentFormErrors } from "./types"
import { DatabaseError } from 'pg'
import { ValidationError } from "next/dist/compiled/amphtml-validator"


export async function enroll(courseId: string) {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "course:enroll")
    if (isAuthorized === undefined) {
        return 
    }

    const errors: EnrollmentFormErrors = {}
    

    try {
        const student = await getStudentById(currentUser.userId) as Student
        if (!student.gpa || !student.level) {
            errors.gpa = "GPA or level cannot be empty, fill the in the profile"
        }

        if (Object.keys(errors).length >= 1) {
            return { errors, status: 400 }
        }

        await insertEnrollment(student.student_id, courseId)
        revalidatePath("/student/courses")
        return { errors: {}, status: 200 }
    } catch (error: DatabaseError | Error | ValidationError) {
        return { status: 500, error: error instanceof Error ? error.message : String(error) }
    }
}