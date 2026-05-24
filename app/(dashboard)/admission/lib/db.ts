"use server"
import { authorizeDbCall } from "@/lib/db/calls"
import pool from '@/lib/db/pool'
import { cacheTag } from "next/cache"



const getStudentNumberCache = async () => {
    "use cache"

    try {
        const { rows } = await pool.query("SELECT COUNT(*) FROM student")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (rows as any[])[0]["count"]
    } catch (error) {
        return error
    }

}

export const getStudentNumber = async () => {
    return await authorizeDbCall("user:read", getStudentNumberCache)
}

const getPartnersNumberCache = async () => {
    "use cache"

    try {
        const { rows } = await pool.query("SELECT COUNT(*) FROM partner_uni_admission")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (rows as any[])[0]["count"]
    } catch (error) {
        return error
    }

}

export const getPartnersNumber = async () => {
    return await authorizeDbCall("user:read", getPartnersNumberCache)
}

const getApprovedCoursesNumberCache = async () => {
    "use cache"
    cacheTag("courses")
    try {
        const { rows } = await pool.query(`SELECT COUNT(*) FROM courses 
                WHERE course_status = 'approved'`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (rows as any[])[0]["count"]
    } catch (error) {
        return error
    }
}

export const getApprovedCoursesNumber = async () => {
    return await authorizeDbCall("course:read", getApprovedCoursesNumberCache)
}

const getUniversitiesAndCoursesNumberCache = async () => {
    "use cache"
    cacheTag("courses")
    try {
        const { rows } = await pool.query(`
            SELECT partner_uni_name AS uni_name, Count(partner_uni_name) AS courses_number from partner_uni_admission p JOIN
            courses c ON
            p.partner_uni_id = c.partner_uni_id AND c.course_status = 'approved'
            GROUP BY partner_uni_name;`)
        return rows
    } catch (error) {
        return error
    }
}

export const getUniversitiesAndCoursesNumber = async () => {
    return await authorizeDbCall("course:read", getUniversitiesAndCoursesNumberCache)
}

const mostRegisteredCoursesCache = async () => {
    "use cache"
    cacheTag("enrollments", "courses")
    try {
        const { rows } = await pool.query(`
            SELECT course_name, course_code, partner_uni_name, COUNT(partner_uni_name) AS enrolled_students from courses c 
            JOIN enrolled_courses en
            ON c.course_id = en.course_id and status = 'approved'
            JOIN partner_uni_admission p 
            ON c.partner_uni_id = p.partner_uni_id
            GROUP BY c.course_id, course_name, course_code, partner_uni_name
            ORDER BY enrolled_students DESC
            LIMIT 5;`)

        return rows
    } catch (error) {
        return error
    }
}

export const mostRegisteredCourses = async () => {
    return await authorizeDbCall("course:read", mostRegisteredCoursesCache)
}