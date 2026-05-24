'use server'
import { authorizeDbCall } from "@/lib/db/calls"
import { MAX_ROWS, Status } from "@/lib/types"
import { Pool, DatabaseError } from 'pg'
import { cacheTag, updateTag } from "next/cache"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})


const getUniCoursesCache = async (query?: string, pageNumber?: number) => {
    "use cache"
    cacheTag("courses")
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    try {
        if (query) {
            const { rows: courses } = await pool.query(`
                SELECT partner_uni_name, location, course_id, course_name, course_code, syllabus, course_status FROM partner_uni_admission p
                JOIN courses c
                ON p.partner_uni_id = c.partner_uni_id
                WHERE (partner_uni_name LIKE CONCAT('%', $1::text , '%')
                OR location LIKE CONCAT('%', $2::text , '%')
                OR course_name LIKE CONCAT('%', $3::text , '%')
                OR course_code LIKE CONCAT('%', $4::text , '%')
                OR course_status LIKE CONCAT('%', $5::text , '%'))
                LIMIT $6 OFFSET $7`, [query, query, query, query, query, MAX_ROWS, offset])

            return courses
        } else {
            const { rows: courses } = await pool.query(`
                SELECT partner_uni_name, location, course_id, course_name, course_code, syllabus, course_status FROM partner_uni_admission p
                JOIN courses c
                ON p.partner_uni_id = c.partner_uni_id
                LIMIT $1 OFFSET $2`, [MAX_ROWS, offset])
            return courses;
        }

    } catch (error) {
        return error;
    }
}

export const getUniCourses = async (query?: string, pageNumber?: number) => {
    return await authorizeDbCall("course:read", getUniCoursesCache, query, pageNumber)
}

const getUniCoursesCountCache = async (query?: string) => {
    "use cache"
    cacheTag("courses")
    try {
        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM partner_uni_admission p
                JOIN courses c
                ON p.partner_uni_id = c.partner_uni_id
                WHERE (partner_uni_name LIKE CONCAT('%', $1::text , '%')
                OR location LIKE CONCAT('%', $2::text , '%')
                OR course_name LIKE CONCAT('%', $3::text , '%')
                OR course_code LIKE CONCAT('%', $4::text , '%')
                OR course_status LIKE CONCAT('%', $5::text , '%'))`, [query, query, query, query, query])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (count as any[])[0]["count"]
        }
        const { rows: count } = await pool.query(`
            SELECT COUNT(*) FROM partner_uni_admission p
            JOIN courses c
            ON p.partner_uni_id = c.partner_uni_id
            `)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (count as any[])[0]["count"]
    } catch (error) {
        return error
    }
}

export const getUniCoursesCount = async (query?: string) => {
    return await authorizeDbCall("course:read", getUniCoursesCountCache, query)
}

export const acceptCourse = async (admissionId: string, courseId: string) => {
    try {
        await pool.query(`
            UPDATE courses
            SET course_status = $1,
            admission_id = $2
            WHERE course_id = $3
            `, [Status.approved, admissionId, courseId])
            updateTag("courses")
    } catch (error) {
        return error
    }
}

export const rejectCourse = async (admissionId: string, courseId: string) => {
    try {
        await pool.query(`
            UPDATE courses
            SET course_status = $1,
            admission_id = $2
            WHERE course_id = $3
            `, [Status.rejected, admissionId, courseId])
            updateTag("courses")
        return
    } catch (error) {
        return error as DatabaseError
    }
}

export const stopProvideCourse = async (admissionId: string, courseId: string) => {
    try {
        await pool.query(`
            UPDATE courses
            SET course_status = $1,
            admission_id = $2
            WHERE course_id = $3
            `, [Status.rejected, admissionId, courseId])
            updateTag("courses")
    } catch (error) {
        return error as DatabaseError
    }
}