'use server'

import { Roles } from "../types"
import pool from '@/lib/db/pool'



export const insertSession = async(userId: string, sessionToken: string, expDate: Date, role: Roles) => {
    
    try {
        await (pool).query(`
            INSERT INTO session 
            ("userId", token, "expDate", role) 
            VALUES( $1 , $2 , $3 , $4)`, [userId, sessionToken, expDate, role])
    } catch (error) {
        return error
    }

}


export const deleteSessionToken = async(sessionToken: string) => {
    try {
        await pool.query(`DELETE FROM session WHERE token = $1 `, [sessionToken])

    } catch (error) {
        return error
    }
}
