'use server'
import { revalidatePath } from "next/cache"
import { CreateCourseErrors, CreateCourseFormState, partner } from "./types"
import { getCurrentUser } from "@/lib/utils"
import { authorize } from "@/lib/db/users"
import { getUploadAuthParams } from "@imagekit/next/server"
import { getUniquePartner, insertCourse } from "./db"
import { Status } from "@/lib/types"

export async function getAuthParams() {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const admission = await getUniquePartner(currentUser.userId) as partner
    const folderName = admission.partner_uni_name.replaceAll(" ", "-")

    const auth = getUploadAuthParams({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!
    })
    return {
        ...auth,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        folder: `/${folderName}`
    }
}

export async function createCourse(prevState: CreateCourseFormState | undefined, formData: FormData) {
    const currentUser = await getCurrentUser({ fullUser: false, redirectIfNotFound: true })
    const isAuthorized = await authorize(currentUser.role, "course:create")
    if (isAuthorized === undefined) {
        return
    }


    const errors: CreateCourseErrors = {}

    const courseName = formData.get("course-name") as string
    const courseCode = formData.get("course-code") as string
    const syllabusUrl = formData.get("syllabus-url") as string

    // Validate Input

    if (!courseName) {
        errors.courseName = "First Name Cannot Be Empty"
    }

    if (courseName.length > 100) {
        errors.courseName = "The length of the course name should be less than 100 characters"
    }

    if (!courseCode) {
        errors.courseCode = "Last Name Cannot Be Empty"
    }

    if (courseCode.length > 100) {
        errors.courseCode = "The length of the course code should be less than 100 characters"
    }

    if (courseName.match(/(<|>|"|!|&|\*|\(|\)|=|\+|\^|'|"|`|\@|#|%|\$|~|\|)/gm)) {
        errors.courseName = "First Name Cannot have special characters"
    }

    if (courseCode.match(/(<|>|"|!|&|\*|\(|\)|=|\+|\^|'|"|`|\@|#|%|\$|~|\|)/gm)) {
        errors.courseCode = "Last Name Cannot have special characters"
    }

    if (!syllabusUrl) {
        errors.syllabus = "Upload the syllabus"
    }


    if (Object.keys(errors).length >= 1) {
        return { errors, payload: formData, status: 400 }
    }

    try {
        const admission = await getUniquePartner(currentUser.userId) as partner

        if (syllabusUrl.length > 100) {
            errors.syllabus = "Shorten the file name"
        }

        if (Object.keys(errors).length >= 1) {
            return { errors, payload: formData, status: 400 }
        }
        await insertCourse(courseName, courseCode, syllabusUrl, Status.pending, admission.partner_uni_id, null)

        revalidatePath("/partner_university/courses")
        return { errors: {}, payload: formData, status: 200 }
    } catch (error) {
        errors.unknownError = error instanceof Error ? error.message : String(error)
        return { errors, payload: formData, status: 500 }
    }
}