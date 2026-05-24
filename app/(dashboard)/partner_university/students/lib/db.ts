/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"
import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import { authorize } from "@/lib/db/users"
import { MAX_ROWS } from "@/lib/types"
import { formatDate, getCurrentUser } from "@/lib/utils"
import pool from '@/lib/db/pool'
import { cacheTag, updateTag } from "next/cache"



const getEnrolledStudentsCache = async (userId:string, query?: string, pageNumber?: number) => {
    "use cache"
    cacheTag("enrollments")
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    try {
        const { rows: uniId } = await pool.query(`SELECT partner_uni_id FROM partner_uni_admission WHERE user_id = $1`, [userId])

        if (query) {
            const { rows: enrollments } = await pool.query(`
                    SELECT s.student_id, CONCAT(u."firstName", ' ', u."lastName") AS student_name, e.course_id, TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date, TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date, grade, course_name, course_code FROM enrolled_courses e 
                    JOIN courses c 
                    ON e.course_id = c.course_id AND partner_uni_id = $1 AND status = 'approved'
                    JOIN student s ON s.student_id = e.student_id
                    JOIN "user" u ON u.id = s.user_id
                    WHERE s.student_id::text LIKE CONCAT('%', $2::text , '%')
                    OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $3::text , '%')
                    OR grade LIKE CONCAT('%', $4::text , '%')
                    OR course_name LIKE CONCAT('%', $5::text , '%')
                    OR course_code LIKE CONCAT('%', $6::text, '%')
                    LIMIT $7 OFFSET $8`, [uniId[0].partner_uni_id, query, query, query, query, query, MAX_ROWS, offset])

                return enrollments
            } else {
                const { rows: enrollments } = await pool.query(`
                    SELECT s.student_id, CONCAT(u."firstName", ' ', u."lastName") AS student_name, e.course_id, grade, TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date, TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date, course_name, course_code FROM enrolled_courses e 
                    JOIN courses c 
                    ON e.course_id = c.course_id AND partner_uni_id = $1 AND status = 'approved'
                    JOIN student s ON s.student_id = e.student_id
                    JOIN "user" u ON u.id = s.user_id
                    LIMIT $2 OFFSET $3
                    `, [uniId[0].partner_uni_id, MAX_ROWS, offset])
            return enrollments;
        }

    } catch (error) {
        return error;
    }
}

export const getEnrolledStudents = async(query?:string, pageNumber?:number) => {
    return await authorizeDbCallWithUserId("enrollment:read", getEnrolledStudentsCache, query, pageNumber)
}

const getEnrollmentsCountCache = async (userId:string, query?: string) => {
    "use cache"
    cacheTag("enrollments")
    try {
        const { rows: uniId } = await pool.query(`SELECT partner_uni_id FROM partner_uni_admission WHERE user_id = $1`, [userId])

        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM enrolled_courses e 
                JOIN courses c 
                ON e.course_id = c.course_id AND partner_uni_id = $1 AND status = 'approved'
                JOIN student s ON s.student_id = e.student_id
                JOIN "user" u ON u.id = s.user_id
                WHERE s.student_id::text LIKE CONCAT('%', $2::text , '%')
                OR CONCAT(u."firstName", ' ', u."lastName") LIKE CONCAT('%', $3::text , '%')
                OR grade LIKE CONCAT('%', $4::text , '%')
                OR course_name LIKE CONCAT('%', $5::text , '%')
                OR course_code LIKE CONCAT('%', $6::text, '%')
                `, [uniId[0].partner_uni_id, query, query, query, query, query])
            return count[0]["count"]
        }
        const { rows: count } = await pool.query(`
            SELECT COUNT(*) FROM enrolled_courses e 
            JOIN courses c 
            ON e.course_id = c.course_id AND partner_uni_id = $1 AND status = 'approved'
            `, [uniId[0].partner_uni_id])
        return count[0]["count"]
    } catch(error) {
        return error
    }
}

export const getEnrollmentsCount = async(query?:string) => {
    return await authorizeDbCallWithUserId("enrollment:read", getEnrollmentsCountCache, query)
}


export const gradeSet = async(studentId: number, courseId: string, grade: string) => {
    const user = await getCurrentUser({fullUser: false, redirectIfNotFound:true})
    const isAuthorized = await authorize(user.role, "enrollment:completed")
    if (!isAuthorized) {
        return
    }
    const date = Date.now();
    const finishing_date = formatDate(date)
    try {
        await pool.query(`
            UPDATE enrolled_courses
            SET status = 'completed',
            grade = $1,
            finishing_date = $2
            WHERE student_id = $3
            AND course_id = $4
            `,
            [grade, finishing_date, studentId, courseId]
        )
        updateTag("enrollments")
    } catch(error) {
        throw error
    }
}