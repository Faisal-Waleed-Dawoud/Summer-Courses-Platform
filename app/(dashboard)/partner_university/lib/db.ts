"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { authorizeDbCallWithUserId } from "@/lib/db/calls"
import pool from '@/lib/db/pool'
import {
    PartnerRecentActivityItem,
    PartnerSummaryStats,
    RequestsPerCourseByStatusItem,
    RequestsPerCourseItem,
} from "./types"
import { cacheTag } from "next/cache"



const getPartnerUniversityId = async (userId: string) => {
    const { rows: uni } = await pool.query(
        `
        SELECT partner_uni_id
        FROM partner_uni_admission
        WHERE user_id = $1
        `,
        [userId]
    )

    return uni[0]?.partner_uni_id
}

const getPartnerSummaryStatsCache = async (userId: string): Promise<PartnerSummaryStats> => {
    "use cache"

    const partnerUniId = await getPartnerUniversityId(userId)

    const { rows: requestRows } = await pool.query(
        `
        SELECT e.status, COUNT(*) AS count
        FROM enrolled_courses e
        JOIN courses c ON c.course_id = e.course_id
        WHERE c.partner_uni_id = $1
        GROUP BY e.status
        `,
        [partnerUniId]
    )

    const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
    }

    for (let i = 0; i < requestRows.length; i++) {
        const status = requestRows[i].status
        const count = Number(requestRows[i].count)
        if (status === "pending") counts.pending = count
        if (status === "approved") counts.approved = count
        if (status === "rejected") counts.rejected = count
        if (status === "completed") counts.completed = count
    }

    const { rows: enrolledRows } = await pool.query(
        `
        SELECT COUNT(DISTINCT e.student_id) AS enrolled_students
        FROM enrolled_courses e
        JOIN courses c ON c.course_id = e.course_id
        WHERE c.partner_uni_id = $1
        AND e.status IN ('approved', 'completed')
        `,
        [partnerUniId]
    )

    const { rows: availableCoursesRows } = await pool.query(
        `
        SELECT COUNT(*) AS available_courses
        FROM courses
        WHERE partner_uni_id = $1
        AND course_status = 'approved'
        `,
        [partnerUniId]
    )

    const totalRequestsReceived =
        counts.pending + counts.approved + counts.rejected + counts.completed

    return {
        totalRequestsReceived,
        pendingRequests: counts.pending,
        approvedRequests: counts.approved + counts.completed,
        rejectedRequests: counts.rejected,
        completedRequests: counts.completed,
        enrolledStudents: Number(enrolledRows[0]?.enrolled_students ?? 0),
        availableCourses: Number(availableCoursesRows[0]?.available_courses ?? 0),
    }
}

export const getPartnerSummaryStats = async () => {
    return await authorizeDbCallWithUserId("enrollment:read", getPartnerSummaryStatsCache)
}

const getRequestsPerCourseCache = async (userId: string, limit = 5): Promise<RequestsPerCourseItem[]> => {
    "use cache"

    const partnerUniId = await getPartnerUniversityId(userId)

    const { rows } = await pool.query(
        `
        SELECT c.course_name, CAST(COUNT(*) AS integer) AS requests
        FROM enrolled_courses e
        JOIN courses c ON c.course_id = e.course_id
        WHERE c.partner_uni_id = $1
        GROUP BY c.course_id, c.course_name
        ORDER BY requests DESC, c.course_name ASC
        LIMIT $2
        `,
        [partnerUniId, limit]
    )

    return rows as RequestsPerCourseItem[]
}

export const getRequestsPerCourse = async (limit = 5) => {
    return await authorizeDbCallWithUserId("enrollment:read", getRequestsPerCourseCache, limit)
}

const getRequestsPerCourseByStatusCache = async (
    userId: string,
    limitPerStatus = 7
): Promise<RequestsPerCourseByStatusItem[]> => {
    "use cache"

    cacheTag("enrollments", "courses")
    const partnerUniId = await getPartnerUniversityId(userId)
    const { rows } = await pool.query(
        `
        SELECT grouped.course_name, CAST(grouped.requests AS integer) AS requests, grouped.status
        FROM (
            SELECT
                c.course_name,
                COUNT(*) AS requests,
                e.status,
                ROW_NUMBER() OVER (
                    PARTITION BY e.status
                    ORDER BY COUNT(*) DESC, c.course_name ASC
                ) AS rn
            FROM enrolled_courses e
            JOIN courses c ON c.course_id = e.course_id
            WHERE c.partner_uni_id = $1
            AND e.status IN ('pending', 'approved', 'rejected', 'completed')
            GROUP BY c.course_name, e.status
        ) grouped
        WHERE grouped.rn <= $2
        ORDER BY grouped.status, grouped.requests DESC, grouped.course_name ASC
        `,
        [partnerUniId, limitPerStatus]
    )

    return rows as RequestsPerCourseByStatusItem[]
}

export const getRequestsPerCourseByStatus = async (limitPerStatus = 7) => {
    return await authorizeDbCallWithUserId(
        "enrollment:read",
        getRequestsPerCourseByStatusCache,
        limitPerStatus
    )
}


const getPartnerRecentActivityCache = async (
    userId: string,
    limit = 6
): Promise<PartnerRecentActivityItem[]> => {
    "use cache"
    cacheTag("enrollments")
    const partnerUniId = await getPartnerUniversityId(userId)
    
    const { rows } = await pool.query(
        `
        SELECT
        e.student_id,
        CONCAT(u."firstName", ' ', u."lastName") AS student_name,
        c.course_name,
        c.course_code,
        e.status,
        TO_CHAR(GREATEST(COALESCE(e.enrollment_date, '1000-01-01'::date), COALESCE(e.finishing_date, '1000-01-01'::date)), 'YY-MM-DD') as last_updated,
        e.grade
        FROM enrolled_courses e
        JOIN courses c ON c.course_id = e.course_id
        JOIN student s ON s.student_id = e.student_id
        JOIN "user" u ON u.id = s.user_id
        WHERE c.partner_uni_id = $1
        ORDER BY
        last_updated DESC
        LIMIT $2
        `,
        [partnerUniId, limit]
    )
    
    return rows as PartnerRecentActivityItem[]
}

export const getPartnerRecentActivity = async (limit = 6) => {
    return await authorizeDbCallWithUserId("enrollment:read", getPartnerRecentActivityCache, limit)
}
