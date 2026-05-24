/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import { getStudentId } from "../courses/lib/db"
import { cacheTag } from "next/cache"
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

const getEnrollmentStatusCountsCache = async (userId: string) => {
    "use cache"
    cacheTag("enrollments")

    try {
        const studentId = await getStudentId(userId)
        const { rows } = await pool.query(
            `
            SELECT status, COUNT(*) AS count
            FROM enrollments
            WHERE student_id = $1
            AND status IN ('pending', 'approved', 'rejected', 'completed')
            GROUP BY status
            `,
            [studentId]
        )

        const base = {
            pending: 0,
            approved: 0,
            rejected: 0,
            completed: 0,
        }

        for (const row of rows) {
            if (row.status === "pending") base.pending = Number(row.count)
            if (row.status === "approved") base.approved = Number(row.count)
            if (row.status === "rejected") base.rejected = Number(row.count)
            if (row.status === "completed") base.completed = Number(row.count)
        }

        return base
    } catch (error) {
        return error
    }
}

export const getEnrollmentStatusCounts = async () => {
    return await authorizeDbCallWithUserId("course:read", getEnrollmentStatusCountsCache)
}

const getCurrentEnrollmentsCache = async (userId: string, limit = 5) => {
    "use cache"

    try {
        const studentId = await getStudentId(userId)
        const { rows } = await pool.query(
            `
            SELECT
                course_name,
                course_code,
                partner_uni_name,
                status,
                TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date
            FROM enrollments
            WHERE student_id = $1
            AND status IN ('approved', 'completed')
            ORDER BY
                (enrollment_date IS NULL),
                enrollment_date DESC,
                finishing_date DESC
            LIMIT $2
            `,
            [studentId, limit]
        )

        return rows
    } catch (error) {
        return error
    }
}

export const getCurrentEnrollments = async (limit = 5) => {
    return await authorizeDbCallWithUserId("course:read", getCurrentEnrollmentsCache, limit)
}

const getRecentActivityCache = async (userId: string, limit = 5) => {
    "use cache"
    cacheTag("enrollments")

    try {
        const studentId = await getStudentId(userId)
        const { rows } = await pool.query(
            `
            SELECT
                course_name,
                course_code,
                partner_uni_name,
                status,
                TO_CHAR(finishing_date, 'YY-MM-DD') AS finishing_date,
                TO_CHAR(enrollment_date, 'YY-MM-DD') AS enrollment_date,
                grade
            FROM enrollments
            WHERE student_id = $1
            AND status IN ('pending', 'approved', 'rejected', 'completed')
            ORDER BY
                (enrollment_date IS NULL),
                enrollment_date DESC,
                finishing_date DESC
            LIMIT $2
            `,
            [studentId, limit]
        )

        return rows
    } catch (error) {
        return error
    }
}

export const getRecentActivity = async (limit = 5) => {
    return await authorizeDbCallWithUserId("course:read", getRecentActivityCache, limit)
}