"use server"

import { authorizeDbCall } from "@/lib/db/calls"
import { MAX_ROWS, Status } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { Pool } from 'pg'
import { cacheTag, updateTag } from "next/cache"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

const getEnrollmentsCache = async (query?: string, status?: string, pageNumber?: number) => {
    "use cache"
    cacheTag("enrollments")
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    try {
        if (query && status) {
            const { rows: courses } = await pool.query(`
                SELECT e.*,
                TO_CHAR(e.finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(e.enrollment_date, 'YY-MM-DD') AS enrollment_date,
                CONCAT(u."firstName", ' ', u."lastName") AS student_name
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE (
                e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%'))
                AND e.status = $7
                LIMIT $8 OFFSET $9`, [query, query, query, query, query, query, status, MAX_ROWS, offset])

            return courses
        } else if (query) {
            const { rows: courses } = await pool.query(`
                SELECT e.*,
                TO_CHAR(e.finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(e.enrollment_date, 'YY-MM-DD') AS enrollment_date,
                CONCAT(u."firstName", ' ', u."lastName") AS student_name
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%')
                LIMIT $7 OFFSET $8`, [query, query, query, query, query, query, MAX_ROWS, offset])

            return courses
        } else if (status) {
            const { rows: courses } = await pool.query(`
                SELECT e.*,
                TO_CHAR(e.finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(e.enrollment_date, 'YY-MM-DD') AS enrollment_date,
                CONCAT(u."firstName", ' ', u."lastName") AS student_name
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE e.status = $1
                LIMIT $2 OFFSET $3`, [status, MAX_ROWS, offset])

            return courses
        } else {
            const { rows: courses } = await pool.query(`
                SELECT e.*,
                TO_CHAR(e.finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(e.enrollment_date, 'YY-MM-DD') AS enrollment_date,
                CONCAT(u."firstName", ' ', u."lastName") AS student_name
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                LIMIT $1 OFFSET $2`, [MAX_ROWS, offset])
            return courses;
        }

    } catch (error) {
        return error;
    }
}

export const getEnrollments = async (query?: string, status?: string, pageNumber?: number) => {
    return await authorizeDbCall("course:read", getEnrollmentsCache, query, status, pageNumber)
}

export const getEnrollmentsCountCache = async (query?: string, status?: string) => {
    "use cache"
    cacheTag("enrollments")
    try {
        if (query && status) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE (e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%'))
                AND e.status = $7`, [query, query, query, query, query, query, status])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (count as any)[0]["count"]
        } else if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%')`, [query, query, query, query, query, query])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (count as any)[0]["count"]
        } else if (status) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE e.status = $1`, [status])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (count as any)[0]["count"]
        }
        const { rows: count } = await pool.query(`
            SELECT COUNT(*) FROM enrollments e
            JOIN student s ON s.student_id = e.student_id
            JOIN "user" u ON u.id = s.user_id
            `)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (count as any)[0]["count"]
    } catch (error) {
        return error
    }
}

export const getEnrollmentsCount = async (query?: string, status?: string) => {
    return await authorizeDbCall("course:read", getEnrollmentsCountCache, query, status)
}

// For the API
const getAllEnrollmentsCache = async (query?: string, status?: string) => {
    "use cache"
    cacheTag("enrollments")
    const selectedColumns = `
    e.student_id,
    CONCAT(u."firstName", ' ', u."lastName") AS student_name,
    e.grade,
    e.enrollment_date,
    e.finishing_date,
    e.status,
    e.course_name,
    e.course_code,
    e.location
    `
    
    try {
        if (query && status) {
            const { rows: enrollments } = await pool.query(`
                SELECT ${selectedColumns}
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE (e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%'))
                AND e.status = $7`, [query, query, query, query, query, query, status])
                return enrollments
        } else if (query) {
            const { rows: enrollments } = await pool.query(`
                SELECT ${selectedColumns}
                FROM enrollments e
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE e.student_id::text LIKE CONCAT('%', $1::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $2::text , '%')
                OR e.location LIKE CONCAT('%', $3::text , '%')
                OR e.course_name LIKE CONCAT('%', $4::text , '%')
                OR e.course_code LIKE CONCAT('%', $5::text , '%')
                OR e.partner_uni_name LIKE CONCAT('%', $6::text , '%')`, [query, query, query, query, query, query])
                
                return enrollments
            } else if (status) {
                const { rows: enrollments } = await pool.query(`
                    SELECT ${selectedColumns}
                    FROM enrollments e
                    JOIN student s ON s.student_id = e.student_id
                    JOIN "user" u ON u.id = s.user_id
                    WHERE e.status = $1`, [status])
                    
                    return enrollments;
                } else {
                    const { rows: enrollments } = await pool.query(`
                        SELECT ${selectedColumns}
                        FROM enrollments e
                        JOIN student s ON s.student_id = e.student_id
                        JOIN "user" u ON u.id = s.user_id
                        `)
                        
                        return enrollments;
                    }
                    
                } catch (error) {
                    return error;
                }
            }
            
            export const getAllEnrollments = async (query?: string, status?: string) => {
                return await authorizeDbCall("course:read", getAllEnrollmentsCache, query, status)
            }

// For the API

export const enrollmentApprove = async (courseId: string, studentId: number, admissionId: string) => {
    const date = Date.now()
    const enrollmentDate = formatDate(date)
    try {
        await pool.query(`
            UPDATE enrolled_courses
            SET status = $1,
            admission_id = $2,
            enrollment_date = $3
            WHERE course_id = $4
            AND student_id = $5
            `, [Status.approved, admissionId, enrollmentDate, courseId, studentId])
            updateTag("enrollments")
        } catch (error) {
            throw error
        }
    }

    export const enrollmentReject = async (courseId: string, studentId: number, admissionId: string) => {
        try {
            await pool.query(`
                UPDATE enrolled_courses
                SET status = $1,
                admission_id = $2
                WHERE course_id = $3 
                AND student_id = $4
                `, [Status.rejected, admissionId, courseId, studentId])
                updateTag("enrollments")
            } catch (error) {
                throw error
            }
        }