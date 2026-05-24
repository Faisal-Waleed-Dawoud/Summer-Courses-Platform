'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import { MAX_ROWS, Status } from "@/lib/types"
import pool from '@/lib/db/pool'
import { cacheTag, updateTag } from "next/cache"




const getCoursesCache = async (userId:string, query?: string, pageNumber?:number) => {
    "use cache"
    cacheTag("courses")
    
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    try {
        const { rows: uniId } = await pool.query(`SELECT partner_uni_id FROM partner_uni_admission WHERE user_id = $1`, [userId])
        if (query) {
            const { rows: courses } = await pool.query(`
                SELECT * FROM courses WHERE 
                (course_name LIKE CONCAT('%', $1::text , '%')
                OR course_code LIKE CONCAT('%', $2::text , '%')
                OR course_status LIKE CONCAT('%', $3::text , '%'))
                AND partner_uni_id = $4
                LIMIT $5 OFFSET $6`, [query, query, query, uniId[0].partner_uni_id, MAX_ROWS, offset])
                
                return courses
        } else {
            const { rows: courses } = await pool.query(`
                SELECT * FROM courses WHERE partner_uni_id = $1 LIMIT $2 OFFSET $3
                `, [uniId[0].partner_uni_id, MAX_ROWS, offset])
            return courses;
        }

    } catch (error) {
        return error;
    }
}

export const getCourses = async(query?:string, pageNumber?:number) => {
    return await authorizeDbCallWithUserId("enrollment:read", getCoursesCache, query, pageNumber)
}

const getCoursesCountCache = async(userId:string, query?:string) => {
    "use cache"
    cacheTag("courses")
    try {
        const { rows: uniId } = await pool.query(`
            SELECT partner_uni_id FROM partner_uni_admission WHERE user_id = $1`, [userId])
        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM courses WHERE 
                (course_name LIKE CONCAT('%', $1::text , '%')
                OR course_code LIKE CONCAT('%', $2::text , '%')
                OR course_status LIKE CONCAT('%', $3::text , '%'))
                AND partner_uni_id = $4`, [query, query, query, uniId[0].partner_uni_id])
            return count[0]["count"]
        }
        const { rows: count } = await pool.query("SELECT COUNT(*) FROM courses WHERE partner_uni_id = $1", [uniId[0].partner_uni_id])

        return count[0]["count"]
    } catch(error) {
        return error
    }
}

export const getCoursesCount = async(query?:string) => {
    return await authorizeDbCallWithUserId("enrollment:read", getCoursesCountCache, query)
}

export const insertCourse = async(courseName: string, courseCode: string, syllabus: string, status:Status, partnerUniId: string,  admissionId?:string | null) => {
    try {
        await pool.query(`
            INSERT INTO 
            courses (course_name, course_code, syllabus, course_status, admission_id, partner_uni_id)
            VALUES($1, $2, $3, $4, $5, $6)`, 
            [courseName, courseCode, syllabus, status, admissionId, partnerUniId])
            updateTag("courses")
    } catch(error) {
        return error
    }
}

export const getUniquePartner = async(userId:string) => {
    try {
        const { rows: partner } = await pool.query(`
            SELECT partner_uni_id, partner_uni_name FROM partner_uni_admission WHERE user_id = $1`, [userId])

        return partner[0]
    } catch(error) {
        return error
    }
}