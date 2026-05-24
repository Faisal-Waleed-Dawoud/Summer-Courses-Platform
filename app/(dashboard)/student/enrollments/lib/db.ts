"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MAX_ROWS } from "@/lib/types"
import pool from '@/lib/db/pool'
import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import { getStudentId } from "../../courses/lib/db"
import { cacheTag } from "next/cache"



const getEnrollmentRequestsCache = async(userId: string, query?: string, pageNumber?: number) => {
    "use cache"
    cacheTag("enrollments")

    let offset = 0;

    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }

    const studentId = await getStudentId(userId)

    try {
        if (query) {
            const { rows: result } = await pool.query(`
                SELECT 
                partner_uni_name, location, course_name, course_code, grade, 
                TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date,
                status
                FROM enrollments 
                WHERE (partner_uni_name LIKE CONCAT('%', $1::text , '%')
                OR location LIKE CONCAT('%', $2::text , '%')
                OR course_name LIKE CONCAT('%', $3::text , '%')
                OR course_code LIKE CONCAT('%', $4::text , '%')
                OR status LIKE CONCAT('%', $5::text , '%')
                OR grade::text LIKE CONCAT('%', $6::text , '%')
                OR TO_CHAR(enrollment_date, 'YY-MM-DD') LIKE CONCAT('%', $7::text , '%')
                OR TO_CHAR(finishing_date, 'YY-MM-DD') LIKE CONCAT('%', $8::text , '%'))
                AND student_id = $9
                LIMIT $10 OFFSET $11`, [query, query, query, query, query, query, query, query, studentId, MAX_ROWS, offset])
                return result
        } else {
            const { rows: result } = await pool.query(`
                SELECT 
                partner_uni_name, location, course_name, course_code, grade, 
                TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date,
                status
                FROM enrollments 
                WHERE student_id = $1
                LIMIT $2 OFFSET $3`, [studentId, MAX_ROWS, offset])
                return result
        } 
    } catch(error) {
        return error
    }
}

export const getEnrollmentRequests = async(query?: string, pageNumber?: number) => {
    return await authorizeDbCallWithUserId("course:read", getEnrollmentRequestsCache, query, pageNumber)
}

const getEnrollmentRequestsCountCache = async(userId: string, query?: string) => {
    "use cache"
    cacheTag("enrollments")
    const studentId = await getStudentId(userId)

    try {
        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*)
                FROM enrollments 
                WHERE (partner_uni_name LIKE CONCAT('%', $1::text , '%')
                OR location LIKE CONCAT('%', $2::text , '%')
                OR course_name LIKE CONCAT('%', $3::text , '%')
                OR course_code LIKE CONCAT('%', $4::text , '%')
                OR status LIKE CONCAT('%', $5::text , '%')
                OR grade::text LIKE CONCAT('%', $6::text , '%')
                OR TO_CHAR(enrollment_date, 'YY-MM-DD') LIKE CONCAT('%', $7::text , '%')
                OR TO_CHAR(finishing_date, 'YY-MM-DD') LIKE CONCAT('%', $8::text , '%'))
                AND student_id = $9`, [query, query, query, query, query, query, query, query, studentId])
                return count[0]["count"]
        } else {
            const { rows: count } = await pool.query(`SELECT COUNT(*) FROM enrollments WHERE student_id = $1`, [studentId])
            return count[0]["count"]
        }
    } catch(error) {
        return error
    }
}

export const getEnrollmentRequestsCount = async(query?: string) => {
    return await authorizeDbCallWithUserId("course:read", getEnrollmentRequestsCountCache, query)
}
