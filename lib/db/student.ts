/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'
import pool from '@/lib/db/pool'
import { cacheTag, updateTag } from "next/cache"



export const insertStudent = async(studentId: number, gpa: number | null, level: number | null, userId: string) => {
    try {
        await pool.query(`
            INSERT INTO student VALUES($1, $2, $3, $4)
            `, [studentId, gpa, level, userId])
    } catch(error) {
        return error
    }
} 

export const updateStudent = async(userId: string, gpa: number, level: number) => {
    try {
        await pool.query(`
            UPDATE student
            SET gpa = $1,
            level = $2
            WHERE user_id = $3
            `, [gpa, level, userId])
            updateTag("student")
    } catch(error) {
        return error
    }
}

export const getStudentById = async(userId: string) => {
    "use cache"
    cacheTag("user")
    try {
        const { rows: user } = await pool.query(`
            SELECT * FROM student WHERE user_id = $1
            `, [userId])
            return user[0]
    } catch(error) {
        return error
    }
} 