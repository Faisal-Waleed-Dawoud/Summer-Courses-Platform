'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import { MAX_ROWS, Status } from "@/lib/types"
import pool from '@/lib/db/pool'
import { cacheTag, updateTag } from "next/cache"



export const insertEnrollment = async(studentId: number, courseId: string) => {
    try {
        await pool.query(`
            INSERT INTO enrolled_courses
            (student_id, course_id, status)
            VALUES ($1, $2, $3)
            `, [studentId, courseId, Status.pending])
            updateTag("enrollments")
    } catch(error) {
        return error
    }
}


const getApprovedCoursesCache = async(userId: string, query?: string, pageNumber?:number) => {
    "use cache"
    cacheTag("courses")
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    const studentId = await getStudentId(userId)
    try {
        if (query) {
            const { rows: courses } = await pool.query(`
                SELECT c.course_id, course_name, course_code, partner_uni_name, location, status, grade, student_id, user_id FROM courses c
                JOIN partner_uni_admission p
                ON c.partner_uni_id = p.partner_uni_id AND course_status = 'approved'
                LEFT JOIN enrolled_courses e
                ON c.course_id = e.course_id
                AND student_id = $1
                WHERE (partner_uni_name LIKE CONCAT('%', $2::text , '%')
                OR location LIKE CONCAT('%', $3::text , '%')
                OR course_name LIKE CONCAT('%', $4::text , '%')
                OR course_code LIKE CONCAT('%', $5::text , '%')
                OR status LIKE CONCAT('%', $6::text , '%'))
                LIMIT $7 OFFSET $8`, [studentId, query, query, query, query, query, MAX_ROWS, offset])
                return courses
        } else {
            const { rows: courses } = await pool.query(`
                SELECT c.course_id, course_name, course_code, partner_uni_name, location, status, grade, student_id, user_id FROM courses c
                JOIN partner_uni_admission p
                ON c.partner_uni_id = p.partner_uni_id AND course_status = 'approved'
                LEFT JOIN enrolled_courses e
                ON c.course_id = e.course_id
                AND e.student_id = $1
                LIMIT $2 OFFSET $3
                `, [studentId, MAX_ROWS, offset])
            return courses;
        }

    } catch (error) {
        return error;
    }
}

export const getApprovedCourses = async(query?:string, pageNumber?: number) => {
    return await authorizeDbCallWithUserId("course:read", getApprovedCoursesCache, query, pageNumber)
}

const getApprovedCoursesCountCache = async(userId:string, query?:string) => {
    "use cache"
    cacheTag("courses")
    const studentId = await getStudentId(userId)
    try {
        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM courses c
                JOIN partner_uni_admission p
                ON c.partner_uni_id = p.partner_uni_id AND course_status = 'approved'
                LEFT JOIN enrolled_courses e
                ON c.course_id = e.course_id
                AND student_id = $1
                WHERE (partner_uni_name LIKE CONCAT('%', $2::text , '%')
                OR location LIKE CONCAT('%', $3::text , '%')
                OR course_name LIKE CONCAT('%', $4::text , '%')
                OR course_code LIKE CONCAT('%', $5::text , '%')
                OR status LIKE CONCAT('%', $6::text , '%'))`, [studentId, query, query, query, query, query])
            return count[0]["count"]
        }
        const { rows: count } = await pool.query(`
            SELECT COUNT(*) FROM courses c
            JOIN partner_uni_admission p
            ON c.partner_uni_id = p.partner_uni_id AND course_status = 'approved'
            LEFT JOIN enrolled_courses e
            ON c.course_id = e.course_id
            AND student_id = $1`, [studentId])
        return count[0]["count"]
    } catch(error) {
        return error
    }
}

export const getStudentId = async(userId:string) => {
    "use cache"
    try {
        const { rows: studentId } = await pool.query(
            `SELECT student_id FROM 
            student WHERE user_id = $1`
        , [userId])
        return studentId[0].student_id
    } catch(error) {
        return error
    }
}

export const getApprovedCoursesCount = async(query?: string) => {
    return await authorizeDbCallWithUserId("course:read", getApprovedCoursesCountCache, query)
}